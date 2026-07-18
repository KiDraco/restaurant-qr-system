const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DB_URL || 'file:./restaurant.db',
  authToken: process.env.TURSO_DB_TOKEN,
});

// Envolver execute para convertir BigInt → Number automáticamente
const originalExecute = client.execute.bind(client);
client.execute = async function (config) {
  const result = await originalExecute(config);
  if (result.rows) {
    result.rows = result.rows.map((row) => {
      const converted = {};
      for (const [key, value] of Object.entries(row)) {
        converted[key] = typeof value === 'bigint' ? Number(value) : value;
      }
      return converted;
    });
  }
  if (typeof result.lastInsertRowid === 'bigint') {
    result.lastInsertRowid = Number(result.lastInsertRowid);
  }
  if (typeof result.rowsAffected === 'bigint') {
    result.rowsAffected = Number(result.rowsAffected);
  }
  return result;
};

const db = client;

async function initializeDatabase() {
  try {
    const tables = [
      `CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_number INTEGER UNIQUE NOT NULL,
        qr_code TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'available',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_number INTEGER NOT NULL,
        request_type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        attended_at DATETIME,
        FOREIGN KEY (table_number) REFERENCES tables(table_number)
      )`,
      `CREATE TABLE IF NOT EXISTS table_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_number INTEGER NOT NULL,
        session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
        session_end DATETIME,
        total_amount DECIMAL(10,2) DEFAULT 0,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (table_number) REFERENCES tables(table_number)
      )`,
      `CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category TEXT NOT NULL,
        available BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        table_number INTEGER NOT NULL,
        menu_item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES table_sessions(id),
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
      )`,
    ];

    for (const sql of tables) {
      await db.execute(sql);
    }

    console.log('✅ Tablas inicializadas correctamente');
  } catch (error) {
    console.error('❌ Error inicializando tablas:', error);
    throw error;
  }
}

module.exports = { db, initializeDatabase };
