import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { syncToGoogleSheet } from '../utils/googleSheets.js';

const router = express.Router();
const canManage = ['admin','president','cat_a'];

router.get('/', authenticateToken, (req,res) => {
  res.json(db.get('events'));
});

// CSV Export for completed events
router.get('/export/csv', authenticateToken, (req, res) => {
  const events = db.get('events');
  const headers = ['Event Name', 'Date', 'Venue (Location)', 'Call Time', 'Status', 'Shoot Team Members (Who Went)', 'Description', 'Notes'];
  
  const rows = events.map(e => {
    const team = (e.members || []).map(m => m.name + (m.role ? ` (${m.role})` : '')).join('; ');
    return [
      `"${(e.name || '').replace(/"/g, '""')}"`,
      `"${(e.date || '').replace(/"/g, '""')}"`,
      `"${(e.venue || '').replace(/"/g, '""')}"`,
      `"${(e.callTime || '').replace(/"/g, '""')}"`,
      `"${(e.status || '').replace(/"/g, '""')}"`,
      `"${team.replace(/"/g, '""')}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=events_export.csv');
  res.send(csvContent);
});

router.post('/', authenticateToken, authorizeRoles(...canManage), async (req,res) => {
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

  if (item.status === 'Completed') {
    syncToGoogleSheet({
      type: 'EVENT_COMPLETED',
      ...item
    }).catch(err => console.error(err));
  }

  res.status(201).json(item);
});

router.put('/:id', authenticateToken, authorizeRoles(...canManage), async (req,res) => {
  const event = db.findOne('events', e => e.id === req.params.id);
  if (!event) return res.status(404).json({error:'Event not found'});
  const updates = {...req.body};
  if (Array.isArray(updates.members)) {
    updates.members = updates.members.map(id => db.findOne('users', u => u.id === id || u.username === id)).filter(Boolean).map(p => ({id:p.id,name:p.name,role:p.role,team:p.team}));
  }
  
  db.update('events', e => e.id === req.params.id, updates);
  const updatedEvent = db.findOne('events', e => e.id === req.params.id);

  if (updatedEvent.status === 'Completed') {
    syncToGoogleSheet({
      type: 'EVENT_COMPLETED',
      ...updatedEvent
    }).catch(err => console.error(err));
  }

  res.json(updatedEvent);
});

// Manual trigger sync to Google Sheets for an event
router.post('/:id/sync-sheets', authenticateToken, async (req, res) => {
  const event = db.findOne('events', e => e.id === req.params.id);
  if (!event) return res.status(404).json({error:'Event not found'});

  const webhookUrl = req.body.webhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(400).json({ error: 'Google Sheet Webhook URL is required. Please provide it or set GOOGLE_SHEET_WEBHOOK_URL in environment.' });
  }

  try {
    const syncRes = await syncToGoogleSheet({
      type: 'EVENT_COMPLETED',
      ...event
    });
    res.json({ message: 'Event details synced to Google Sheet successfully', result: syncRes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync to Google Sheet: ' + err.message });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles(...canManage), (req,res) => {
  const ok = db.remove('events', e => e.id === req.params.id);
  if (!ok) return res.status(404).json({error:'Event not found'});
  res.json({message:'Event deleted'});
});

export default router;
