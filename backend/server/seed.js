import bcrypt from 'bcryptjs';
import { db } from './db.js';

export async function seedDatabase() {
  console.log('🧹 Clearing old portal data...');

  // Remove ALL old data
  db.reset();

  const salt = await bcrypt.genSalt(10);

  // Only fresh admin account
  const adminPassword = await bcrypt.hash(
    'admin@p',
    salt
  );

  db.insert('users', {
    id: 'user_admin',
    username: 'admin',
    password: adminPassword,
    name: 'System Admin',
    role: 'admin',
    category: 'Leadership',
    designation: 'System Administrator',
    team: 'Management',
    phone: '+91 98765 43210'
  });

  console.log('✅ Fresh database created.');
  console.log('👤 Username: admin');
  console.log('🔑 Password: admin@p');
}

if (
  process.argv[1] &&
  process.argv[1].endsWith('seed.js')
) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seed completed.');
    })
    .catch(err => {
      console.error('❌ Seed Error:', err);
      process.exit(1);
    });
}
