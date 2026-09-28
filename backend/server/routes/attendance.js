import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

function getCurrentTimeString() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Get Attendance Records
router.get('/', authenticateToken, (req, res) => {
  const { date, userId, role, team } = req.query;
  let records = db.get('attendance');

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

  const targetDate = date || new Date().toISOString().split('T')[0];
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
      remarks: remarks || existing.remarks
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
    remarks: remarks || 'Session Attendance'
  });

  logAudit(req, 'ATTENDANCE_MARKED', req.user.username, req.user.role, `Marked Junior attendance for ${targetUser.name}: ${status} at ${timeLogged}`);
  res.status(201).json(newRecord);
});

// Core Member Self Attendance Request
router.post('/request-cat-a', authenticateToken, authorizeRoles('cat_a', 'admin', 'president'), (req, res) => {
  const targetDate = req.body.date || new Date().toISOString().split('T')[0];
  const user = db.findOne('users', u => u.id === req.user.id || u.username === req.user.username);

  const existing = db.findOne('attendance', r => (r.userId === user.id || r.userUsername === user.username) && r.date === targetDate);
  if (existing) {
    return res.status(400).json({ error: 'Attendance request already exists for today' });
  }

  const timeLogged = getCurrentTimeString();
  const newRecord = db.insert('attendance', {
    date: targetDate,
    userId: user.id,
    userName: user.name,
    userUsername: user.username,
    role: 'cat_a',
    category: 'Core',
    team: user.team,
    status: 'Pending Confirmation',
    timeLogged: timeLogged,
    srApprovedBy: null,
    srApprovedTime: null,
    presApprovedBy: null,
    presApprovedTime: null,
    remarks: 'Core Member Self-Attendance Request'
  });

  logAudit(req, 'CORE_ATTENDANCE_REQUESTED', req.user.username, req.user.role, `${user.name} requested Core attendance (Pending President Approval)`);
  res.status(201).json(newRecord);
});

// Core Team Attendance President Approval Route
router.post('/approve-cat-a', authenticateToken, authorizeRoles('president'), (req, res) => {
  const { attendanceId, approvalType, action } = req.body;

  if (!attendanceId || !approvalType) {
    return res.status(400).json({ error: 'Attendance ID and approval type are required' });
  }

  const record = db.findOne('attendance', r => r.id === attendanceId);
  if (!record) {
    return res.status(404).json({ error: 'Attendance record not found' });
  }

  const timeStr = getCurrentTimeString();
  let updates = {};

  if (approvalType !== 'president') {
    return res.status(403).json({ error: 'Only President approval is allowed for Core attendance' });
  }

  if (req.user.role !== 'president') {
    return res.status(403).json({ error: 'Only President can approve Core attendance' });
  }

  updates.presApprovedBy = action === 'approve' ? req.user.name : null;
  updates.presApprovedTime = action === 'approve' ? timeStr : null;

  const isPresApproved = updates.presApprovedBy || record.presApprovedBy;

  if (action === 'reject') {
    updates.status = 'Rejected';
  } else if (isPresApproved) {
    updates.status = 'Approved';
  } else {
    updates.status = 'Pending Confirmation';
  }

  db.update('attendance', r => r.id === attendanceId, updates);

  logAudit(req, 'CORE_ATTENDANCE_CONFIRMED', req.user.username, req.user.role, `${approvalType.toUpperCase()} ${action}D Core Team attendance for ${record.userName}. Final Status: ${updates.status}`);
  res.json({ message: 'Approval updated successfully', status: updates.status });
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
    adminModifiedBy: req.user.name
  });

  logAudit(req, 'ADMIN_ATTENDANCE_OVERRIDE', req.user.username, req.user.role, `Admin modified attendance record for ${record.userName} on ${record.date} to ${status}`);
  res.json({ message: 'Attendance record modified by Admin' });
});

export default router;
