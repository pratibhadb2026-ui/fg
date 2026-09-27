import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

// Get all users (Admin & Category A Seniors)
router.get('/', authenticateToken, (req, res) => {
  const users = db.get('users').map(u => {
    const { password, ...rest } = u;
    return rest;
  });
  res.json(users);
});

// Admin Create New User
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { username, password, name, role, category, designation, team, phone } = req.body;

  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: 'Username, password, name, and role are required' });
  }

  const existing = db.findOne('users', u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = db.insert('users', {
    username: username.trim(),
    password: hashedPassword,
    name: name.trim(),
    role: role, // 'admin', 'cat_a', 'cat_b', 'president'
    category: category || (role === 'cat_a' ? 'A' : role === 'cat_b' ? 'B' : 'Leadership'),
    designation: designation || 'Team Member',
    team: team || 'General',
    phone: phone || ''
  });

  logAudit(req, 'USER_CREATED', req.user.username, req.user.role, `Created new account: ${name} (${role})`);

  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

// Admin Update User
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { name, role, category, designation, team, phone, password } = req.body;

  const user = db.findOne('users', u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let updateData = {
    name: name || user.name,
    role: role || user.role,
    category: category || user.category,
    designation: designation || user.designation,
    team: team || user.team,
    phone: phone !== undefined ? phone : user.phone
  };

  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }

  db.update('users', u => u.id === id, updateData);

  logAudit(req, 'USER_UPDATED', req.user.username, req.user.role, `Updated account details for ${user.name}`);
  res.json({ message: 'User updated successfully' });
});

// Admin Delete User
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const { id } = req.params;
  const user = db.findOne('users', u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.remove('users', u => u.id === id);
  logAudit(req, 'USER_DELETED', req.user.username, req.user.role, `Deleted user ${user.name} (${user.username})`);
  res.json({ message: 'User deleted successfully' });
});

export default router;
