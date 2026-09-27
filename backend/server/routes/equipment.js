import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();
const canManage = ['admin','president','cat_a'];

router.get('/', authenticateToken, (req,res) => {
  res.json(db.get('equipment'));
});

router.post('/', authenticateToken, authorizeRoles(...canManage), (req,res) => {
  const { name, description, takenBy, issueDate, expectedReturnDate, status, notes } = req.body;
  if (!name || !takenBy || !issueDate) return res.status(400).json({error:'Equipment name, taken by and issue date are required'});
  const person = db.findOne('users', u => u.id === takenBy || u.username === takenBy);
  const item = db.insert('equipment', {
    name: name.trim(), description: description || '', takenBy: person?.id || takenBy,
    takenByName: person?.name || takenBy, issueDate, expectedReturnDate: expectedReturnDate || '',
    returnDate: '', status: status || 'Taken', notes: notes || '', issuedBy: req.user.name,
    issuedById: req.user.id
  });
  res.status(201).json(item);
});

router.put('/:id', authenticateToken, authorizeRoles(...canManage), (req,res) => {
  const item = db.findOne('equipment', e => e.id === req.params.id);
  if (!item) return res.status(404).json({error:'Equipment record not found'});
  const updates = {...req.body};
  if (updates.takenBy) {
    const person = db.findOne('users', u => u.id === updates.takenBy || u.username === updates.takenBy);
    if (person) { updates.takenBy = person.id; updates.takenByName = person.name; }
  }
  db.update('equipment', e => e.id === req.params.id, updates);
  res.json(db.findOne('equipment', e => e.id === req.params.id));
});

router.delete('/:id', authenticateToken, authorizeRoles(...canManage), (req,res) => {
  const ok = db.remove('equipment', e => e.id === req.params.id);
  if (!ok) return res.status(404).json({error:'Equipment record not found'});
  res.json({message:'Equipment record deleted'});
});

export default router;
