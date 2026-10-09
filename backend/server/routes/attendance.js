import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

function getCurrentTimeString() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getIndiaDateString() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

function isDefaultWorkingDay(dateString) {
  const day = new Date(`${dateString}T12:00:00Z`).getUTCDay();
  return day !== 0; // Sunday is non-working by default; Monday-Saturday are working days.
}

function getWorkingDay(dateString) {
  const override = db.findOne('working_days', r => r.date === dateString);
  if (override) return { isWorkingDay: Boolean(override.isWorkingDay), reason: override.reason || '' };
  return { isWorkingDay: isDefaultWorkingDay(dateString), reason: isDefaultWorkingDay(dateString) ? 'Default working day' : 'Sunday' };
}

function ensureTodayJuniorAbsences(dateString) {
  if (dateString !== getIndiaDateString()) return;
  const day = getWorkingDay(dateString);
  if (!day.isWorkingDay) return;

  const juniors = db.find('users', u => u.role === 'cat_b');
  for (const junior of juniors) {
    const existing = db.findOne('attendance', r =>
      (r.userId === junior.id || r.userUsername === junior.username) && r.date === dateString
    );
    if (!existing) {
      db.insert('attendance', {
        date: dateString,
        userId: junior.id,
        userName: junior.name,
        userUsername: junior.username,
        role: 'cat_b',
        category: 'Juniors',
        team: junior.team,
        status: 'Absent',
        markedBy: 'system',
        markedByName: 'System',
        timeLogged: 'N/A',
        remarks: 'Auto-marked Absent because no Present attendance was recorded on this working day.',
        autoMarked: true,
        workingDay: true
      });
    }
  }
}

// Working-day calendar: Admin can override the default Mon-Sat working / Sunday non-working rule.
router.get('/working-days', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const date = req.query.date || getIndiaDateString();
  res.json({ date, ...getWorkingDay(date) });
});

router.post('/working-days', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const { date, isWorkingDay, reason } = req.body;
  if (!date || typeof isWorkingDay !== 'boolean') {
    return res.status(400).json({ error: 'date and isWorkingDay are required' });
  }

  const existing = db.findOne('working_days', r => r.date === date);
  const payload = { date, isWorkingDay, reason: reason || (isWorkingDay ? 'Working day override' : 'Holiday / non-working day'), setBy: req.user.name };
  if (existing) db.update('working_days', r => r.id === existing.id, payload);
  else db.insert('working_days', payload);

  // A holiday/non-working day must have NO Junior attendance record at all.
  // Remove both old auto-absences and any Present/Absent records that may have been
  // created before the date was changed to a holiday. This keeps the day completely
  // out of Junior attendance calculations.
  if (!isWorkingDay) {
    db.remove('attendance', r => r.date === date && r.role === 'cat_b');
  }

  logAudit(req, 'ATTENDANCE_CALENDAR_UPDATED', req.user.username, req.user.role,
    `${isWorkingDay ? 'Set working day' : 'Set non-working day'} for ${date}: ${payload.reason}`);
  res.json({ date, ...getWorkingDay(date) });
});

// Get Attendance Records
router.get('/', authenticateToken, (req, res) => {
  const { date, userId, role, team } = req.query;
  let records = db.get('attendance');

  // Admin and Alumni are system/observer accounts, not attendance-profile members.
  // Never expose their attendance records in the attendance module.
  const hiddenUserIds = new Set(
    db.find('users', u => ['admin','alumni'].includes(u.role)).flatMap(u => [u.id, u.username]).filter(Boolean)
  );
  records = records.filter(r => !hiddenUserIds.has(r.userId) && !hiddenUserIds.has(r.userUsername));

  // Safety cleanup: never expose Junior attendance records for a holiday/non-working day.
  // This also fixes legacy records created before the Working Days feature existed.
  const juniorNonWorking = new Set(
    records
      .filter(r => r.role === 'cat_b' && !getWorkingDay(r.date).isWorkingDay)
      .map(r => r.date)
  );
  if (juniorNonWorking.size) {
    db.remove('attendance', r => r.role === 'cat_b' && juniorNonWorking.has(r.date));
    records = db.get('attendance');
  }

  if (date) ensureTodayJuniorAbsences(date);

  if (date) {
    records = records.filter(r => r.date === date);
  }
  if (userId) {
    records = records.filter(r => r.userId === userId || r.userUsername === userId);
  }
  if (role) {
    records = records.filter(r => r.role === role);
  }
  if (team) {
    records = records.filter(r => r.team === team);
  }

  // Attendance visibility rules: Juniors can only see themselves; Core can inspect Juniors;
  // President/Admin can inspect everyone.
  if (req.user.role === 'cat_b') {
    const own = records.filter(r => r.userId === req.user.id || r.userUsername === req.user.username);
    records = userId ? own.filter(r => r.userId === userId || r.userUsername === userId) : own;
  } else if (req.user.role === 'cat_a' && userId) {
    const target = db.findOne('users', u => u.id === userId || u.username === userId);
    if (target && target.role !== 'cat_b') return res.status(403).json({ error: 'Core can view only Junior attendance profiles' });
  }

  res.json(records);
});

// Core Members / President / Admin Mark Junior Attendance
router.post('/mark-cat-b', authenticateToken, authorizeRoles('admin', 'cat_a', 'president'), (req, res) => {
  const { userId, status, date, remarks } = req.body;

  if (!userId || !status) {
    return res.status(400).json({ error: 'User ID and status are required' });
  }

  const targetDate = date || getIndiaDateString();
  const workingDay = getWorkingDay(targetDate);
  if (!workingDay.isWorkingDay) {
    return res.status(400).json({ error: `Attendance cannot be marked because ${targetDate} is a non-working day (${workingDay.reason}).` });
  }
  const targetUser = db.findOne('users', u => u.id === userId || u.username === userId || u.id === 'user_' + userId);

  if (!targetUser) {
    return res.status(404).json({ error: 'Target Junior user not found' });
  }

  const timeLogged = status === 'Present' ? getCurrentTimeString() : 'N/A';

  const existing = db.findOne('attendance', r => (r.userId === targetUser.id || r.userUsername === targetUser.username) && r.date === targetDate);

  if (existing) {
    db.update('attendance', r => r.id === existing.id, {
      status: status,
      markedBy: req.user.id,
      markedByName: req.user.name,
      timeLogged: timeLogged,
      remarks: remarks || existing.remarks,
      workingDay: true,
      autoMarked: false
    });
    logAudit(req, 'ATTENDANCE_UPDATED', req.user.username, req.user.role, `Updated Junior attendance for ${targetUser.name}: ${status} at ${timeLogged}`);
    return res.json({ message: 'Attendance updated successfully', status, timeLogged });
  }

  const newRecord = db.insert('attendance', {
    date: targetDate,
    userId: targetUser.id,
    userName: targetUser.name,
    userUsername: targetUser.username,
    role: 'cat_b',
    category: 'Juniors',
    team: targetUser.team,
    status: status,
    markedBy: req.user.id,
    markedByName: req.user.name,
    timeLogged: timeLogged,
    remarks: remarks || 'Session Attendance',
    workingDay: true,
    autoMarked: false
  });

  logAudit(req, 'ATTENDANCE_MARKED', req.user.username, req.user.role, `Marked Junior attendance for ${targetUser.name}: ${status} at ${timeLogged}`);
  res.status(201).json(newRecord);
});


// President directly marks Core attendance. Core self-attendance is not used.
router.post('/mark-cat-a', authenticateToken, authorizeRoles('president'), (req, res) => {
  const { userId, status, date, remarks } = req.body;
  if (!userId || !['Present', 'Absent'].includes(status)) {
    return res.status(400).json({ error: 'User ID and valid status are required' });
  }
  const targetDate = date || getIndiaDateString();
  const workingDay = getWorkingDay(targetDate);
  if (!workingDay.isWorkingDay) {
    return res.status(400).json({ error: `Attendance cannot be marked because ${targetDate} is a non-working day (${workingDay.reason}).` });
  }
  const targetUser = db.findOne('users', u => (u.id === userId || u.username === userId) && u.role === 'cat_a');
  if (!targetUser) return res.status(404).json({ error: 'Target Core user not found' });

  const timeLogged = status === 'Present' ? getCurrentTimeString() : 'N/A';
  const existing = db.findOne('attendance', r => (r.userId === targetUser.id || r.userUsername === targetUser.username) && r.date === targetDate);
  const payload = {
    status,
    markedBy: req.user.id,
    markedByName: req.user.name,
    timeLogged,
    remarks: remarks || 'Core attendance marked by President',
    workingDay: true,
    autoMarked: false,
    presMarked: true,
    presMarkedBy: req.user.name,
    presMarkedAt: new Date().toISOString(),
    adminModified: false,
    changeSource: 'President'
  };

  if (existing) {
    db.update('attendance', r => r.id === existing.id, payload);
    logAudit(req, 'CORE_ATTENDANCE_UPDATED', req.user.username, req.user.role,
      `President updated Core attendance for ${targetUser.name}: ${status} at ${timeLogged}`);
    return res.json({ message: 'Core attendance updated successfully', status, timeLogged });
  }

  const newRecord = db.insert('attendance', {
    date: targetDate,
    userId: targetUser.id,
    userName: targetUser.name,
    userUsername: targetUser.username,
    role: 'cat_a',
    category: 'Core',
    team: targetUser.team,
    ...payload
  });
  logAudit(req, 'CORE_ATTENDANCE_MARKED', req.user.username, req.user.role,
    `President marked Core attendance for ${targetUser.name}: ${status} at ${timeLogged}`);
  res.status(201).json(newRecord);
});

// Admin Override / Modify Attendance Record
router.put('/modify/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const { id } = req.params;
  const { status, timeLogged, remarks } = req.body;

  const record = db.findOne('attendance', r => r.id === id);
  if (!record) {
    return res.status(404).json({ error: 'Attendance record not found' });
  }

  db.update('attendance', r => r.id === id, {
    status: status || record.status,
    timeLogged: timeLogged !== undefined ? timeLogged : record.timeLogged,
    remarks: remarks !== undefined ? remarks : record.remarks,
    adminModifiedBy: req.user.name,
    adminModifiedAt: new Date().toISOString(),
    adminModified: true,
    changeSource: 'System Admin'
  });

  logAudit(req, 'ADMIN_ATTENDANCE_OVERRIDE', req.user.username, req.user.role, `Admin modified attendance record for ${record.userName} on ${record.date} to ${status}`);
  res.json({ message: 'Attendance record modified by Admin' });
});

export default router;
