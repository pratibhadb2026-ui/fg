import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { db, initializeDatabase } from './db.js';
import { seedDatabase } from './seed.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import attendanceRoutes from './routes/attendance.js';
import taskRoutes from './routes/tasks.js';
import auditRoutes from './routes/audit.js';
import equipmentRoutes from './routes/equipment.js';
import eventRoutes from './routes/events.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 5000;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  'http://localhost:5173';

const NODE_ENV =
  process.env.NODE_ENV ||
  'development';

const corsOptions = {
  origin: [
    FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH'
  ],
  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ]
};

app.use(cors(corsOptions));
app.use(express.json());

console.log(
  `✅ Server starting in ${NODE_ENV} mode on port ${PORT}`
);

// ======================================================
// POSTGRESQL INITIALIZATION
// ======================================================

await initializeDatabase();


// ======================================================
// ONE-TIME DATABASE RESET
// ======================================================
//
// IMPORTANT:
// Set this to true ONLY for the first deployment.
// It will delete old demo users/tasks/attendance/logs
// and create ONLY the admin account.
//
// After successful deployment, change:
// true  -> false
//
// Otherwise every future deployment will delete your data.
// ======================================================

const FRESH_DATABASE = false;

if (FRESH_DATABASE) {
  console.log(
    '🧹 FRESH DATABASE MODE ENABLED'
  );

  console.log(
    '⚠️ Deleting all existing PostgreSQL portal data...'
  );

  // Delete everything
  db.reset();

  // Give queued DELETE queries a moment to complete
  await new Promise(resolve =>
    setTimeout(resolve, 1000)
  );

  // Create ONLY admin
  await seedDatabase();

  console.log(
    '✅ PostgreSQL has been freshly initialized.'
  );

  console.log(
    '👤 Username: admin'
  );

  console.log(
    '🔑 Password: admin@p'
  );
}


// ======================================================
// NORMAL MODE
// ======================================================

else {
  const users = db.get('users');

  if (users.length === 0) {
    console.log(
      'No users found. Creating initial admin...'
    );

    await seedDatabase();
  } else {
    console.log(
      `✅ Existing PostgreSQL data found: ${users.length} users`
    );
  }
}


// ======================================================
// API ROUTES
// ======================================================

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/users',
  userRoutes
);

app.use(
  '/api/attendance',
  attendanceRoutes
);

app.use(
  '/api/tasks',
  taskRoutes
);

app.use(
  '/api/audit',
  auditRoutes
);

app.use('/api/equipment', equipmentRoutes);
app.use('/api/events', eventRoutes);


// ======================================================
// HEALTH CHECK
// ======================================================

app.get(
  '/api/health',
  (req, res) => {
    res.json({
      status: 'OK',
      message:
        'Pratibha Main Portal API Server Running',
      database: 'PostgreSQL',
      timestamp: new Date()
    });
  }
);


// ======================================================
// FRONTEND
// ======================================================

const distPath = path.join(
  __dirname,
  '../dist'
);

if (fs.existsSync(distPath)) {
  app.use(
    express.static(distPath)
  );

  app.get(
    '*',
    (req, res) => {
      res.sendFile(
        path.join(
          distPath,
          'index.html'
        )
      );
    }
  );
}


// ======================================================
// START SERVER
// ======================================================

app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      '===================================================='
    );

    console.log(
      '🚀 Pratibha Main Portal Server is live!'
    );

    console.log(
      `🌐 Port: ${PORT}`
    );

    console.log(
      '===================================================='
    );
  }
);
