import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { syncToGoogleSheet } from '../utils/googleSheets.js';

const router = express.Router();
const canManage = ['admin','president','cat_a'];

router.get('/', authenticateToken, (req,res) => {
  res.json(db.get('equipment'));
});

// CSV Export for equipment list
router.get('/export/csv', authenticateToken, (req, res) => {
  const items = db.get('equipment');
  const headers = ['Equipment Name', 'Taken By', 'Issue Date', 'Expected Return Date', 'Actual Return Date', 'Status', 'Description', 'Notes', 'Issued By'];
  
  const rows = items.map(x => [
    `"${(x.name || '').replace(/"/g, '""')}"`,
    `"${(x.takenByName || '').replace(/"/g, '""')}"`,
    `"${(x.issueDate || '').replace(/"/g, '""')}"`,
    `"${(x.expectedReturnDate || '').replace(/"/g, '""')}"`,
    `"${(x.returnDate || '').replace(/"/g, '""')}"`,
    `"${(x.status || '').replace(/"/g, '""')}"`,
    `"${(x.description || '').replace(/"/g, '""')}"`,
    `"${(x.notes || '').replace(/"/g, '""')}"`,
    `"${(x.issuedBy || '').replace(/"/g, '""')}"`
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=equipment_export.csv');
  res.send(csvContent);
});

router.post('/', authenticateToken, authorizeRoles(...canManage), async (req,res) => {
  const { name, description, takenBy, issueDate, expectedReturnDate, returnDate, status, notes } = req.body;
  if (!name || !takenBy || !issueDate) return res.status(400).json({error:'Equipment name, taken by and issue date are required'});
  const person = db.findOne('users', u => u.id === takenBy || u.username === takenBy);
  
  const currentStatus = status || 'Taken';
  const actualReturnDate = currentStatus === 'Returned' ? (returnDate || new Date().toISOString().slice(0, 10)) : (returnDate || '');

  const item = db.insert('equipment', {
    name: name.trim(), description: description || '', takenBy: person?.id || takenBy,
    takenByName: person?.name || takenBy, issueDate, expectedReturnDate: expectedReturnDate || '',
    returnDate: actualReturnDate, status: currentStatus, notes: notes || '', issuedBy: req.user.name,
    issuedById: req.user.id
  });

  if (item.status === 'Returned') {
    syncToGoogleSheet({
      type: 'EQUIPMENT_RETURNED',
      ...item
    }).catch(err => console.error(err));
  }

  res.status(201).json(item);
});

router.put('/:id', authenticateToken, authorizeRoles(...canManage), async (req,res) => {
  const item = db.findOne('equipment', e => e.id === req.params.id);
  if (!item) return res.status(404).json({error:'Equipment record not found'});
  const updates = {...req.body};
  if (updates.takenBy) {
    const person = db.findOne('users', u => u.id === updates.takenBy || u.username === updates.takenBy);
    if (person) { updates.takenBy = person.id; updates.takenByName = person.name; }
  }

  if (updates.status === 'Returned' && !updates.returnDate) {
    updates.returnDate = new Date().toISOString().slice(0, 10);
  }

  db.update('equipment', e => e.id === req.params.id, updates);
  const updatedItem = db.findOne('equipment', e => e.id === req.params.id);

  if (updatedItem.status === 'Returned') {
    syncToGoogleSheet({
      type: 'EQUIPMENT_RETURNED',
      ...updatedItem
    }).catch(err => console.error(err));
  }

  res.json(updatedItem);
});

// Manual trigger sync to Google Sheets for equipment
router.post('/:id/sync-sheets', authenticateToken, async (req, res) => {
  const item = db.findOne('equipment', e => e.id === req.params.id);
  if (!item) return res.status(404).json({error:'Equipment record not found'});

  try {
    const syncRes = await syncToGoogleSheet({
      type: 'EQUIPMENT_RETURNED',
      ...item
    });
    res.json({ message: 'Equipment status synced to Google Sheet successfully', result: syncRes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync to Google Sheet: ' + err.message });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles(...canManage), (req,res) => {
  const ok = db.remove('equipment', e => e.id === req.params.id);
  if (!ok) return res.status(404).json({error:'Equipment record not found'});
  res.json({message:'Equipment record deleted'});
});

export default router;
