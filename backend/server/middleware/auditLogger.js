import { db } from '../db.js';

export function logAudit(req, action, username, role, details) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    
    db.insert('audit_logs', {
      timestamp: new Date().toISOString(),
      username: username || 'System/Guest',
      role: role || 'N/A',
      action: action,
      ip: ip.replace('::ffff:', ''),
      userAgent: userAgent,
      details: details || ''
    });
  } catch (err) {
    console.error('Audit Logging Error:', err);
  }
}
