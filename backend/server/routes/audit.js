import express from 'express';
import { db } from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

// Admin Get Security & Login Audit Logs
router.get('/logs', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const logs = db.get('audit_logs');
  // Sort latest first
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(logs.slice(0, 100)); // Return latest 100 entries
});

export default router;


// Clear all login/security audit logs. Admin only.
router.delete('/logs', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const count = db.get('audit_logs').length;
  db.remove('audit_logs', () => true);
  // Keep the clear action itself out of the cleared audit history.
  res.json({ message: 'Audit logs cleared successfully', count });
});
