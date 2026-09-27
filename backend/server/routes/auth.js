import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

// Login Route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.findOne('users', u => u.username.toLowerCase() === username.trim().toLowerCase());

  if (!user) {
    logAudit(req, 'LOGIN_FAILURE', username, 'unknown', 'Invalid username attempted');
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    logAudit(req, 'LOGIN_FAILURE', user.username, user.role, 'Incorrect password attempt');
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = generateToken(user);
  logAudit(req, 'LOGIN_SUCCESS', user.username, user.role, `${user.name} (${user.role.toUpperCase()}) logged in`);

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    message: 'Login successful',
    token,
    user: userWithoutPassword
  });
});

// Current User Info
router.get('/me', authenticateToken, (req, res) => {
  const user = db.findOne('users', u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

export default router;
