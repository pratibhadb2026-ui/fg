import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();
const canManage = ['admin','president','cat_a'];

router.get('/', authenticateToken, (req,res) => {
  // Clean legacy events too, so Admin/Alumni never appear in shoot-member lists.
  const events = db.get('events').map(event => ({
    ...event,
    members: Array.isArray(event.members)
      ? event.members.filter(m => !['admin','alumni'].includes(m.role))
      : []
  }));
  res.json(events);
});

router.post('/', authenticateToken, authorizeRoles(...canManage), (req,res) => {
  const { name, date, venue, description, members, callTime, status, notes } = req.body;
  if (!name || !date || !venue) return res.status(400).json({error:'Event name, date and venue are required'});
  const selected = Array.isArray(members) ? members : [];
  // Admin and Alumni accounts are never valid shoot/event assignees.
  const people = selected
    .map(id => db.findOne('users', u => u.id === id || u.username === id))
    .filter(Boolean)
    .filter(p => !['admin','alumni'].includes(p.role));
  const item = db.insert('events', {
    name: name.trim(), date, venue: venue.trim(), description: description || '',
    members: people.map(p => ({id:p.id,name:p.name,role:p.role,team:p.team})),
    callTime: callTime || '', status: status || 'Planned', notes: notes || '',
    createdBy: req.user.name, createdById: req.user.id
  });
  res.status(201).json(item);
});

router.put('/:id', authenticateToken, authorizeRoles(...canManage), (req,res) => {
  const event = db.findOne('events', e => e.id === req.params.id);
  if (!event) return res.status(404).json({error:'Event not found'});
  const updates = {...req.body};
  const generateEditTask = Boolean(updates.generateEditTask);
  const editAssigneeIds = Array.isArray(updates.editAssigneeIds) ? updates.editAssigneeIds : [];
  const editTaskTitle = String(updates.editTaskTitle || `Edit & Finalize Event: ${event.name}`).trim();
  delete updates.generateEditTask;
  delete updates.editAssigneeIds;
  delete updates.editTaskTitle;

  if (Array.isArray(updates.members)) {
    updates.members = updates.members
      .map(id => db.findOne('users', u => u.id === id || u.username === id))
      .filter(Boolean)
      .filter(p => !['admin','alumni'].includes(p.role))
      .map(p => ({id:p.id,name:p.name,role:p.role,team:p.team}));
  }

  const wasCompleted = event.status === 'Completed';
  const isCompletingNow = updates.status === 'Completed' && !wasCompleted;

  if (isCompletingNow && generateEditTask) {
    const assignees = editAssigneeIds
      .map(id => db.findOne('users', u => u.id === id || u.username === id))
      .filter(Boolean)
      .filter(u => ['cat_a','cat_b'].includes(u.role));
    if (!assignees.length) {
      return res.status(400).json({error:'Select at least one Core or Junior member for the event edit task.'});
    }
    const isGroup = assignees.length > 1;
    db.insert('tasks', {
      title: editTaskTitle,
      description: `Edit task automatically generated after completing event/shoot: ${event.name}. Review footage/assets, edit and submit the final output.`,
      assignedTo: isGroup ? null : assignees[0].id,
      assignedToName: isGroup ? `Group (${assignees.length} members)` : assignees[0].name,
      assignedToUsername: isGroup ? assignees.map(u=>u.username).join(', ') : assignees[0].username,
      groupMembers: assignees.map(u=>({id:u.id,name:u.name,username:u.username,designation:u.designation||'',team:u.team||''})),
      isGroupTask: isGroup,
      assignedBy: req.user.id,
      assignedByName: req.user.name,
      team: isGroup ? '' : (assignees[0].team || ''),
      sourceRole: req.user.role,
      source: 'event_edit',
      sourceEventId: event.id,
      sourceEventName: event.name,
      priority: 'High',
      status: 'Pending',
      progress: 0,
      deadline: new Date(Date.now()+7*86400000).toISOString().split('T')[0],
      comments: [{author:req.user.name,text:`Auto-generated from completed event/shoot: ${event.name}`,time:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}]
    });
    logAudit(req,'EVENT_EDIT_TASK_GENERATED',req.user.username,req.user.role,`Generated event edit task for ${event.name} and assigned it to ${assignees.map(u=>u.name).join(', ')}`);
  }

  db.update('events', e => e.id === req.params.id, updates);
  res.json(db.findOne('events', e => e.id === req.params.id));
});

router.delete('/:id', authenticateToken, authorizeRoles(...canManage), (req,res) => {
  const ok = db.remove('events', e => e.id === req.params.id);
  if (!ok) return res.status(404).json({error:'Event not found'});
  res.json({message:'Event deleted'});
});

export default router;
