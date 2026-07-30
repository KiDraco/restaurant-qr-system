const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_SETUP_SECRET = 'test-setup-secret';
process.env.TURSO_DB_URL = 'file:./test-restaurant.db';
process.env.TURSO_DB_TOKEN = '';

const testDbPath = path.resolve(__dirname, '../../test-restaurant.db');
for (const f of [testDbPath, testDbPath + '-wal', testDbPath + '-shm']) {
  try { fs.unlinkSync(f); } catch (e) {}
}
