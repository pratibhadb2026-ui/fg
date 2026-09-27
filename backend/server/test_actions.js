import { db } from './db.js';
import bcrypt from 'bcryptjs';

async function testActions() {
  console.log('Testing User Creation and Task Assignment logic directly...');

  // 1. Create a new Senior and Junior user
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('senior123', salt);

  const newUser = db.insert('users', {
    username: 'senior_test_99',
    password: password,
    name: 'New Test Senior',
    role: 'cat_a',
    category: 'A',
    designation: 'Senior Test Lead',
    team: 'Team Alpha',
    phone: '+91 99999 88888'
  });

  console.log('User created:', newUser.name, newUser.role);

  // 2. Assign task to a junior
  const junior = db.findOne('users', u => u.role === 'cat_b');
  const admin = db.findOne('users', u => u.role === 'admin');

  const newTask = db.insert('tasks', {
    title: 'Test Assignment Task',
    description: 'Verify task creation functionality',
    assignedTo: junior.id,
    assignedToName: junior.name,
    assignedToUsername: junior.username,
    assignedBy: admin.id,
    assignedByName: admin.name,
    team: junior.team,
    priority: 'High',
    status: 'Pending',
    progress: 0,
    deadline: '2026-08-20',
    comments: []
  });

  console.log('Task assigned:', newTask.title, 'to', newTask.assignedToName);
}

testActions();
