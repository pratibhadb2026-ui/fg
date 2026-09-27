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
    tasks = tasks.filter(t => t.assignedTo === req.user.id || t.assignedToUsername === req.user.username);
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
  const teamTasks = db.find('tasks', t => t.team === userTeam);
  const teamAttendance = db.find('attendance', a => a.team === userTeam && a.date === new Date().toISOString().split('T')[0]);

  const teamData = teammates.map(member => {
    const memberTasks = teamTasks.filter(t => t.assignedTo === member.id || t.assignedToUsername === member.username);
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

// Create / Assign Task (Admin, Category A Seniors, President)
router.post('/', authenticateToken, authorizeRoles('admin', 'cat_a', 'president'), (req, res) => {
  const { title, description, assignedTo, priority, deadline } = req.body;

  if (!title || !assignedTo) {
    return res.status(400).json({ error: 'Title and assigned junior user are required' });
  }

  // Flexible user matching by id OR username
  const targetUser = db.findOne('users', u => u.id === assignedTo || u.username === assignedTo || u.id === 'user_' + assignedTo);
  if (!targetUser) {
    return res.status(404).json({ error: 'Target assigned Junior user not found' });
  }

  const newTask = db.insert('tasks', {
    title: title.trim(),
    description: description || '',
    assignedTo: targetUser.id,
    assignedToName: targetUser.name,
    assignedToUsername: targetUser.username,
    assignedBy: req.user.id,
    assignedByName: req.user.name,
    team: targetUser.team,
    priority: priority || 'Medium',
    status: 'Pending',
    progress: 0,
    deadline: deadline || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    comments: [
      { author: req.user.name, text: `Task assigned with priority ${priority || 'Medium'}`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
    ]
  });

  logAudit(req, 'TASK_ASSIGNED', req.user.username, req.user.role, `Assigned task "${title}" to ${targetUser.name} (${targetUser.team})`);
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
