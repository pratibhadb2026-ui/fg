import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

// Get Tasks
router.get('/', authenticateToken, (req, res) => {
  const { assignedTo, team, status } = req.query;
  let tasks = db.get('tasks');

  if (assignedTo) {
    tasks = tasks.filter(t => t.assignedTo === assignedTo || t.assignedToUsername === assignedTo);
  }
  if (team) {
    tasks = tasks.filter(t => t.team === team);
  }
  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }

  if (req.user.role === 'cat_b' && !assignedTo && !team) {
    tasks = tasks.filter(t => t.assignedTo === req.user.id || t.assignedToUsername === req.user.username || (Array.isArray(t.groupMembers) && t.groupMembers.some(m => m.id === req.user.id || m.username === req.user.username)));
  }

  res.json(tasks);
});

// Category B Team Status Section
router.get('/team-status', authenticateToken, (req, res) => {
  const userTeam = req.user.team;
  if (!userTeam || userTeam === 'Management') {
    return res.json([]);
  }

  const teammates = db.find('users', u => u.team === userTeam && u.role === 'cat_b');
  const teamTasks = db.find('tasks', t => t.team === userTeam || (Array.isArray(t.groupMembers) && t.groupMembers.some(m => m.team === userTeam)));

  const teamAttendance = db.find('attendance', a => a.team === userTeam && a.date === new Date().toISOString().split('T')[0]);

  const teamData = teammates.map(member => {
    const memberTasks = teamTasks.filter(t => t.assignedTo === member.id || t.assignedToUsername === member.username || (Array.isArray(t.groupMembers) && t.groupMembers.some(m => m.id === member.id || m.username === member.username)));
    const todayAtt = teamAttendance.find(a => a.userId === member.id || a.userUsername === member.username);

    return {
      id: member.id,
      name: member.name,
      username: member.username,
      designation: member.designation,
      attendanceToday: todayAtt ? todayAtt.status : 'Not Marked',
      timeLogged: todayAtt ? todayAtt.timeLogged : 'N/A',
      activeTasksCount: memberTasks.filter(t => t.status !== 'Completed').length,
      completedTasksCount: memberTasks.filter(t => t.status === 'Completed').length,
      tasks: memberTasks
    };
  });

  res.json(teamData);
});

// Create / Assign Task: Admin/Core/President can assign to Juniors; Alumni can assign to Core/President.
router.post('/', authenticateToken, authorizeRoles('admin', 'cat_a', 'president', 'alumni'), (req, res) => {
  const { title, description, assignedTo, assignedToIds, priority, deadline } = req.body;
  const requestedIds = Array.isArray(assignedToIds) && assignedToIds.length ? assignedToIds : (assignedTo ? [assignedTo] : []);

  if (!title || !requestedIds.length) {
    return res.status(400).json({ error: 'Title and at least one assignee are required' });
  }

  const targetUsers = requestedIds
    .map(value => db.findOne('users', u => u.id === value || u.username === value || u.id === 'user_' + value))
    .filter(Boolean);

  if (targetUsers.length !== requestedIds.length) {
    return res.status(404).json({ error: 'One or more selected users were not found' });
  }

  if (req.user.role === 'alumni' && targetUsers.some(u => !['cat_a','president'].includes(u.role))) {
    return res.status(403).json({ error: 'Alumni can assign tasks only to Core Team or President.' });
  }
  if (['cat_a','president'].includes(req.user.role) && targetUsers.some(u => u.role !== 'cat_b')) {
    return res.status(403).json({ error: 'Core/President can assign tasks only to Juniors.' });
  }

  const isGroup = targetUsers.length > 1;
  const firstTarget = targetUsers[0];
  const newTask = db.insert('tasks', {
    title: title.trim(),
    description: description || '',
    assignedTo: isGroup ? null : firstTarget.id,
    assignedToName: isGroup ? `Group (${targetUsers.length} members)` : firstTarget.name,
    assignedToUsername: isGroup ? targetUsers.map(u => u.username).join(', ') : firstTarget.username,
    groupMembers: targetUsers.map(u => ({ id: u.id, name: u.name, username: u.username, designation: u.designation || '', team: u.team || '' })),
    isGroupTask: isGroup,
    assignedBy: req.user.id,
    assignedByName: req.user.name,
    team: isGroup ? '' : (firstTarget.team || ''),
    sourceRole: req.user.role,
    priority: priority || 'Medium',
    status: 'Pending',
    progress: 0,
    deadline: deadline || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    comments: [
      { author: req.user.name, text: `${isGroup ? 'Group task' : 'Task'} assigned with priority ${priority || 'Medium'}`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
    ]
  });

  logAudit(req, 'TASK_ASSIGNED', req.user.username, req.user.role, `Assigned ${isGroup ? 'group task' : 'task'} "${title}" to ${targetUsers.map(u => u.name).join(', ')}`);
  res.status(201).json(newTask);
});

// Update Task Status / Progress / Comment
router.put('/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, progress, comment } = req.body;

  const task = db.findOne('tasks', t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  let updatedComments = [...(task.comments || [])];
  if (comment && comment.trim()) {
    updatedComments.push({
      author: req.user.name,
      text: comment.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    });
  }

  let finalProgress = progress !== undefined ? Number(progress) : task.progress;
  if (status === 'Completed') finalProgress = 100;
  if (status === 'Pending') finalProgress = 0;

  db.update('tasks', t => t.id === id, {
    status: status || task.status,
    progress: finalProgress,
    comments: updatedComments
  });

  logAudit(req, 'TASK_UPDATED', req.user.username, req.user.role, `Updated task "${task.title}": ${status || task.status} (${finalProgress}%)`);
  res.json({ message: 'Task status updated successfully' });
});

export default router;
