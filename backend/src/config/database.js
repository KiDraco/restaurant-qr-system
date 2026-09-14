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
      `CREATE TABLE IF NOT EXISTS promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        discount_percentage INTEGER NOT NULL DEFAULT 0,
        image_url TEXT,
        start_date TEXT,
        end_date TEXT,
        active BOOLEAN DEFAULT 1,
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

    // Migrations
    try {
      await db.execute('ALTER TABLE menu_items ADD COLUMN image_url TEXT DEFAULT NULL');
    } catch (e) {
      // Column may already exist
    }

    // Migración: tabla themes (plantillas/teemas del menú público)
    try {
      await db.execute(`CREATE TABLE IF NOT EXISTS themes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 0,
        is_default BOOLEAN DEFAULT 0,
        config TEXT NOT NULL DEFAULT '{}',
        canvas_json TEXT DEFAULT NULL,
        page_format TEXT DEFAULT 'A4-portrait',
        background_config TEXT DEFAULT '{"type":"color","value":"#FFFFFF"}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      try { await db.execute('CREATE INDEX IF NOT EXISTS idx_themes_name_lower ON themes (lower(name))'); } catch (_) {}
      const existing = await db.execute("SELECT COUNT(*) AS count FROM themes WHERE name = 'Clasico Centrado'");
      if (Number(existing.rows[0].count) === 0) {
        console.log('⚡ Seeding 5 themes...');
        await db.execute('UPDATE themes SET is_active = 0');
        const themes = [
          {
            name: 'Clásico Centrado',
            config: JSON.stringify({ logo_url: null, colors: { primary: '#C0392B', secondary: '#2C3E50', background: '#FFF9F0', text: '#2C3E50' }, font_family: 'Georgia', background_type: 'color', background_value: '#FFF9F0' }),
            canvas_json: JSON.stringify({ elements: [
              { id: 'e1', type: 'text', x: 200, y: 150, width: 394, height: 80, zIndex: 1, config: { content: 'Mi Restaurante', fontSize: 36, fontFamily: 'Georgia', color: '#C0392B', textAlign: 'center', fontWeight: 'bold' }, locked: false, visible: true },
              { id: 'e2', type: 'image', x: 250, y: 280, width: 294, height: 200, zIndex: 2, config: { src: '', alt: 'Imagen principal' }, locked: false, visible: true },
              { id: 'e3', type: 'category', x: 150, y: 530, width: 494, height: 150, zIndex: 3, config: { label: 'Nuestros Platos', fontSize: 20, color: '#2C3E50' }, locked: false, visible: true },
              { id: 'e4', type: 'text', x: 150, y: 730, width: 494, height: 120, zIndex: 4, config: { content: '• Plato Tradicional\n• Bebida Típica\n• Postre Casero', fontSize: 16, color: '#555' }, locked: false, visible: true },
            ], page_format: 'A4-portrait', background_config: { type: 'color', value: '#FFF9F0' } }),
            is_active: true,
            is_default: true,
          },
          {
            name: 'Moderno Minimalista',
            config: JSON.stringify({ logo_url: null, colors: { primary: '#2C3E50', secondary: '#ECF0F1', background: '#FFFFFF', text: '#2C3E50' }, font_family: 'system-ui', background_type: 'color', background_value: '#FFFFFF' }),
            canvas_json: JSON.stringify({ elements: [
              { id: 'e1', type: 'text', x: 50, y: 60, width: 694, height: 60, zIndex: 1, config: { content: 'BISTRO', fontSize: 28, fontFamily: 'system-ui', color: '#2C3E50', textAlign: 'left', fontWeight: '300' }, locked: false, visible: true },
              { id: 'e2', type: 'image', x: 450, y: 160, width: 294, height: 300, zIndex: 2, config: { src: '', alt: 'Foto' }, locked: false, visible: true },
              { id: 'e3', type: 'category', x: 50, y: 500, width: 694, height: 80, zIndex: 3, config: { label: 'Carta', fontSize: 18, color: '#7f8c8d' }, locked: false, visible: true },
              { id: 'e4', type: 'text', x: 50, y: 610, width: 694, height: 200, zIndex: 4, config: { content: '• Ensalada César\n• Pasta Fresca\n• Café de especialidad', fontSize: 14, color: '#888' }, locked: false, visible: true },
            ], page_format: 'A4-portrait', background_config: { type: 'color', value: '#FFFFFF' } }),
            is_active: true,
            is_default: false,
          },
          {
            name: 'Elegante Oro',
            config: JSON.stringify({ logo_url: null, colors: { primary: '#D4A843', secondary: '#1A1A2E', background: '#FAFAFA', text: '#1A1A2E' }, font_family: 'Playfair Display', background_type: 'gradient', background_value: '#FAFAFA' }),
            canvas_json: JSON.stringify({ elements: [
              { id: 'e1', type: 'text', x: 200, y: 120, width: 394, height: 100, zIndex: 1, config: { content: 'La Belle Epoque', fontSize: 32, fontFamily: 'Playfair Display', color: '#D4A843', textAlign: 'center', fontWeight: 'bold' }, locked: false, visible: true },
              { id: 'e2', type: 'image', x: 250, y: 260, width: 294, height: 180, zIndex: 2, config: { src: '', alt: 'Logo elegante' }, locked: false, visible: true },
              { id: 'e3', type: 'category', x: 150, y: 480, width: 494, height: 100, zIndex: 3, config: { label: 'Degustación', fontSize: 22, color: '#D4A843' }, locked: false, visible: true },
              { id: 'e4', type: 'text', x: 150, y: 620, width: 494, height: 150, zIndex: 4, config: { content: '• Jamón Ibérico\n• Vino Selección\n• Trufa Negra', fontSize: 16, color: '#555' }, locked: false, visible: true },
            ], page_format: 'A4-portrait', background_config: { type: 'color', value: '#FAFAFA' } }),
            is_active: false,
            is_default: false,
          },
          {
            name: 'Casual Vibrante',
            config: JSON.stringify({ logo_url: null, colors: { primary: '#E67E22', secondary: '#27AE60', background: '#FEF9E7', text: '#2C3E50' }, font_family: 'Montserrat', background_type: 'color', background_value: '#FEF9E7' }),
            canvas_json: JSON.stringify({ elements: [
              { id: 'e1', type: 'text', x: 150, y: 40, width: 494, height: 70, zIndex: 1, config: { content: 'Sabores del Sur', fontSize: 30, fontFamily: 'Montserrat', color: '#E67E22', textAlign: 'center', fontWeight: '700' }, locked: false, visible: true },
              { id: 'e2', type: 'image', x: 150, y: 150, width: 494, height: 250, zIndex: 2, config: { src: '', alt: 'Foto vibrante' }, locked: false, visible: true },
              { id: 'e3', type: 'category', x: 50, y: 440, width: 694, height: 80, zIndex: 3, config: { label: 'Especiales', fontSize: 18, color: '#27AE60' }, locked: false, visible: true },
              { id: 'e4', type: 'text', x: 50, y: 550, width: 694, height: 200, zIndex: 4, config: { content: '• Empanadas caseras\n• Chimichurri\n• Alfajores artesanales', fontSize: 15, color: '#555' }, locked: false, visible: true },
            ], page_format: 'A4-portrait', background_config: { type: 'color', value: '#FEF9E7' } }),
            is_active: false,
            is_default: false,
          },
          {
            name: 'Rústico Campestre',
            config: JSON.stringify({ logo_url: null, colors: { primary: '#8B4513', secondary: '#F5DEB3', background: '#FAF0E6', text: '#3E2723' }, font_family: 'Lora', background_type: 'image', background_value: '#FAF0E6' }),
            canvas_json: JSON.stringify({ elements: [
              { id: 'e1', type: 'text', x: 100, y: 60, width: 594, height: 80, zIndex: 1, config: { content: 'La Huerta', fontSize: 28, fontFamily: 'Lora', color: '#8B4513', textAlign: 'center', fontWeight: 'bold' }, locked: false, visible: true },
              { id: 'e2', type: 'image', x: 100, y: 180, width: 594, height: 200, zIndex: 2, config: { src: '', alt: 'Entorno rústico' }, locked: false, visible: true },
              { id: 'e3', type: 'category', x: 50, y: 420, width: 694, height: 80, zIndex: 3, config: { label: 'Productos Locales', fontSize: 18, color: '#8B4513' }, locked: false, visible: true },
              { id: 'e4', type: 'text', x: 50, y: 530, width: 694, height: 220, zIndex: 4, config: { content: '• Verduras de temporada\n• Pan horneado\n• Mermelada artesanal', fontSize: 15, color: '#666' }, locked: false, visible: true },
            ], page_format: 'A4-portrait', background_config: { type: 'color', value: '#FAF0E6' } }),
            is_active: false,
            is_default: false,
          },
        ];
        for (const t of themes) {
          await db.execute({
            sql: `INSERT INTO themes (name, config, is_default, is_active, canvas_json, page_format, background_config) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [t.name, t.config, t.is_default, t.is_active, t.canvas_json, t.page_format || 'A4-portrait', JSON.stringify(t.background_config)],
          });
        }
        console.log('✅ 5 themes seeded');
      }
    } catch (e) { console.error('⚠️ Migración themes falló:', e.message || e); }

    // Migración: agregar campos de canvas a themes existentes
    try { await db.execute('ALTER TABLE themes ADD COLUMN canvas_json TEXT DEFAULT NULL'); } catch (_) {}
    try { await db.execute('ALTER TABLE themes ADD COLUMN page_format TEXT DEFAULT \'A4-portrait\''); } catch (_) {}
    try { await db.execute('ALTER TABLE themes ADD COLUMN background_config TEXT DEFAULT \'{"type":"color","value":"#FFFFFF"}\''); } catch (_) {}

    console.log('✅ Tablas inicializadas correctamente');
  } catch (error) {
    console.error('❌ Error inicializando tablas:', error);
    throw error;
  }
}

module.exports = { db, initializeDatabase };
