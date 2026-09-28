import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_DB_FILE = path.join(__dirname, 'local-data.json');
const USE_POSTGRES = Boolean(process.env.DATABASE_URL);

const collections = ['users', 'attendance', 'tasks', 'audit_logs', 'equipment', 'events', 'working_days'];
const cache = { users: [], attendance: [], tasks: [], audit_logs: [], equipment: [], events: [], working_days: [] };

let pool = null;
let writeQueue = Promise.resolve();

function enqueue(work) {
  writeQueue = writeQueue.then(work).catch(err => {
    console.error('Database write error:', err);
  });
  return writeQueue;
}

function saveLocal() {
  fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

function loadLocal() {
  if (!fs.existsSync(LOCAL_DB_FILE)) {
    saveLocal();
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf8'));
    for (const collection of collections) {
      cache[collection] = Array.isArray(data[collection]) ? data[collection] : [];
    }
  } catch (err) {
    console.error('⚠️ Local database file could not be read. Starting fresh.', err.message);
    for (const collection of collections) cache[collection] = [];
    saveLocal();
  }
}

export async function initializeDatabase() {
  if (!USE_POSTGRES) {
    loadLocal();
    console.log('✅ Local development database initialized.');
    console.log(`📁 ${LOCAL_DB_FILE}`);
    return;
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 5
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS portal_data (
      collection TEXT NOT NULL,
      id TEXT NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (collection, id)
    )
  `);

  for (const collection of collections) {
    const result = await pool.query(
      `SELECT id, data FROM portal_data WHERE collection = $1 ORDER BY created_at ASC`,
      [collection]
    );
    cache[collection] = result.rows.map(row => row.data);
  }

  console.log('✅ PostgreSQL database initialized.');
}

export const db = {
  get(collection) {
    return cache[collection] || [];
  },

  find(collection, filterFn) {
    return this.get(collection).filter(filterFn);
  },

  findOne(collection, filterFn) {
    return this.get(collection).find(filterFn);
  },

  insert(collection, item) {
    if (!cache[collection]) cache[collection] = [];

    const newItem = {
      id: item.id || `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: item.createdAt || new Date().toISOString(),
      ...item
    };

    cache[collection].push(newItem);

    if (!USE_POSTGRES) {
      saveLocal();
      return newItem;
    }

    enqueue(async () => {
      await pool.query(
        `INSERT INTO portal_data (collection, id, data)
         VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (collection, id)
         DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [collection, newItem.id, JSON.stringify(newItem)]
      );
    });

    return newItem;
  },

  update(collection, filterFn, updateFnOrData) {
    if (!cache[collection]) return false;

    let updated = false;

    cache[collection] = cache[collection].map(item => {
      if (!filterFn(item)) return item;

      updated = true;
      const updates = typeof updateFnOrData === 'function' ? updateFnOrData(item) : updateFnOrData;
      const updatedItem = { ...item, ...updates, updatedAt: new Date().toISOString() };

      if (USE_POSTGRES) {
        enqueue(async () => {
          await pool.query(
            `INSERT INTO portal_data (collection, id, data)
             VALUES ($1, $2, $3::jsonb)
             ON CONFLICT (collection, id)
             DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
            [collection, updatedItem.id, JSON.stringify(updatedItem)]
          );
        });
      }

      return updatedItem;
    });

    if (!USE_POSTGRES && updated) saveLocal();
    return updated;
  },

  remove(collection, filterFn) {
    if (!cache[collection]) return false;

    const removed = cache[collection].filter(filterFn);
    if (removed.length === 0) return false;

    cache[collection] = cache[collection].filter(item => !filterFn(item));

    if (!USE_POSTGRES) {
      saveLocal();
      return true;
    }

    for (const item of removed) {
      enqueue(async () => {
        await pool.query(`DELETE FROM portal_data WHERE collection = $1 AND id = $2`, [collection, item.id]);
      });
    }

    return true;
  },

  reset() {
    for (const collection of collections) cache[collection] = [];

    if (!USE_POSTGRES) {
      saveLocal();
      return;
    }

    enqueue(async () => {
      await pool.query('DELETE FROM portal_data');
    });
  }
};

export async function closeDatabase() {
  await writeQueue;
  if (pool) await pool.end();
}
