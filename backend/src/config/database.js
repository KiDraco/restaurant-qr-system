const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH || './restaurant.db';

// Crear conexión a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Inicializar tablas
const initializeDatabase = () => {
  db.serialize(() => {
    // Tabla de mesas
    db.run(`
      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_number INTEGER UNIQUE NOT NULL,
        qr_code TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'available',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creando tabla tables:', err);
      else console.log('✓ Tabla tables lista');
    });

    // Tabla de solicitudes
    db.run(`
      CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_number INTEGER NOT NULL,
        request_type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        attended_at DATETIME,
        FOREIGN KEY (table_number) REFERENCES tables(table_number)
      )
    `, (err) => {
      if (err) console.error('Error creando tabla requests:', err);
      else console.log('✓ Tabla requests lista');
    });

    // Tabla de sesiones de mesa
    db.run(`
      CREATE TABLE IF NOT EXISTS table_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_number INTEGER NOT NULL,
        session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
        session_end DATETIME,
        total_amount DECIMAL(10,2) DEFAULT 0,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (table_number) REFERENCES tables(table_number)
      )
    `, (err) => {
      if (err) console.error('Error creando tabla table_sessions:', err);
      else console.log('✓ Tabla table_sessions lista');
    });

    // Tabla de productos del menú
    db.run(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category TEXT NOT NULL,
        available BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creando tabla menu_items:', err);
      else console.log('✓ Tabla menu_items lista');
    });

    // Tabla de usuarios (auth)
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creando tabla users:', err);
      else console.log('✓ Tabla users lista');
    });

    // Tabla de órdenes
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
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
      )
    `, (err) => {
      if (err) console.error('Error creando tabla orders:', err);
      else console.log('✓ Tabla orders lista');
    });
  });
};

module.exports = { db, initializeDatabase };