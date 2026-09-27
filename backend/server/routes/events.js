import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();
const canManage = ['admin','president','cat_a'];

router.get('/', authenticateToken, (req,res) => {
  res.json(db.get('events'));
});

router.post('/', authenticateToken, authorizeRoles(...canManage), (req,res) => {
  const { name, date, venue, description, members, callTime, status, notes } = req.body;
  if (!name || !date || !venue) return res.status(400).json({error:'Event name, date and venue are required'});
  const selected = Array.isArray(members) ? members : [];
  const people = selected.map(id => db.findOne('users', u => u.id === id || u.username === id)).filter(Boolean);
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
  if (Array.isArray(updates.members)) {
    updates.members = updates.members.map(id => db.findOne('users', u => u.id === id || u.username === id)).filter(Boolean).map(p => ({id:p.id,name:p.name,role:p.role,team:p.team}));
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
