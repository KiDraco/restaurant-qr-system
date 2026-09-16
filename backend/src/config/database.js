const { createClient } = require('@libsql/client');
const crypto = require('crypto');

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
      // Seed ONLY on a fresh DB. Never delete: a name-based guard with mismatched
      // accents used to reseed (and wipe user themes) on every cold start.
      const existing = await db.execute('SELECT COUNT(*) AS count FROM themes');
      if (Number(existing.rows[0].count) === 0) {
        console.log('⚡ Seeding 5 themes...');
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
            background_config: { type: 'color', value: '#FFF9F0' },
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
            is_active: false,
            is_default: false,
            background_config: { type: 'color', value: '#FFFFFF' },
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
            background_config: { type: 'color', value: '#FAFAFA' },
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
            background_config: { type: 'color', value: '#FEF9E7' },
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
            background_config: { type: 'color', value: '#FAF0E6' },
          },
        ];
        for (const t of themes) {
          await db.execute({
            sql: `INSERT INTO themes (name, config, is_default, is_active, canvas_json, page_format, background_config) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [t.name, t.config, t.is_default ? 1 : 0, t.is_active ? 1 : 0, t.canvas_json, t.page_format || 'A4-portrait', JSON.stringify(t.background_config || { type: 'color', value: '#FFFFFF' })],
          });
        }
        console.log('✅ 5 themes seeded');
      }
    } catch (e) { console.error('⚠️ Migración themes falló:', e.message || e); }

    // Migración: deduplicar themes por nombre (el seed con guard por nombre
    // acentuado generaba filas duplicadas en arranques concurrentes).
    // Conserva: fila activa > canvas más grande (personalizado) > id menor.
    try {
      const rows = await db.execute('SELECT id, name, is_active, length(canvas_json) AS clen FROM themes');
      const byName = {};
      for (const r of rows.rows) {
        (byName[r.name] = byName[r.name] || []).push(r);
      }
      for (const [name, group] of Object.entries(byName)) {
        if (group.length < 2) continue;
        group.sort((a, b) =>
          ((b.is_active ? 1 : 0) - (a.is_active ? 1 : 0)) ||
          ((b.clen || 0) - (a.clen || 0)) ||
          (a.id - b.id)
        );
        const keeper = group[0];
        if (!keeper.is_active && group.some((r) => r.is_active)) {
          await db.execute({ sql: 'UPDATE themes SET is_active = 1 WHERE id = ?', args: [keeper.id] });
        }
        for (const dup of group.slice(1)) {
          await db.execute({ sql: 'DELETE FROM themes WHERE id = ?', args: [dup.id] });
        }
        console.log(`    🧹 "${name}": ${group.length - 1} duplicado(s) eliminado(s), se conserva id=${keeper.id}`);
      }
    } catch (e) { console.error('⚠️ Migración dedup themes falló:', e.message || e); }

    // Migración: agregar campos de canvas a themes existentes
    try { await db.execute('ALTER TABLE themes ADD COLUMN canvas_json TEXT DEFAULT NULL'); } catch (_) {}
    try { await db.execute('ALTER TABLE themes ADD COLUMN page_format TEXT DEFAULT \'A4-portrait\''); } catch (_) {}
    try { await db.execute('ALTER TABLE themes ADD COLUMN background_config TEXT DEFAULT \'{"type":"color","value":"#FFFFFF"}\''); } catch (_) {}

    // Migración: convertir themes legacy a multi-page
    try {
      const themes = await db.execute('SELECT * FROM themes');
      for (const theme of themes.rows) {
        const t = theme;
        // Skip if already multi-page
        if (t.canvas_json) {
          try {
            const canvas = typeof t.canvas_json === 'string' ? JSON.parse(t.canvas_json) : t.canvas_json;
            if (canvas.pages && Array.isArray(canvas.pages)) continue;
          } catch (_) {}
        }
        
        console.log(`🔧 Migrando theme "${t.name}" a multi-page...`);
        
        const legacyConfig = t.config ? (typeof t.config === 'string' ? JSON.parse(t.config) : t.config) : {};
        const globalConfig = JSON.stringify({
          colors: legacyConfig.colors || { primary: '#FF6B6B', secondary: '#4ECDC4', background: '#FFFFFF', text: '#2A2A2A' },
          font_family: legacyConfig.font_family || 'system-ui',
          background_config: legacyConfig.background_type && legacyConfig.background_value
            ? { type: legacyConfig.background_type, value: legacyConfig.background_value }
            : { type: 'color', value: legacyConfig.background_value || '#FFFFFF' },
        });
        
        // Extract legacy elements
        let legacyElements = [];
        if (t.canvas_json) {
          try {
            const canvas = typeof t.canvas_json === 'string' ? JSON.parse(t.canvas_json) : t.canvas_json;
            if (canvas.elements && Array.isArray(canvas.elements)) {
              legacyElements = canvas.elements.map(el => ({ ...el, id: el.id || crypto.randomUUID(), zIndex: el.zIndex ?? 0, locked: el.locked ?? false, visible: el.visible !== false }));
            }
          } catch (_) {}
        }
        
        // Build default pages (same as migration script)
        const defaultPages = [
          { id: 'scan', name: 'Login / QR', type: 'scan', icon: '📱', elements: [
            { id: crypto.randomUUID(), type: 'text', x: 50, y: 80, width: 275, height: 60, zIndex: 0, locked: false, visible: true, config: { content: 'Bienvenido', fontSize: 28, fontFamily: 'system-ui', color: '#2A2A2A', textAlign: 'center', fontWeight: 'bold' } },
            { id: crypto.randomUUID(), type: 'text', x: 50, y: 150, width: 275, height: 40, zIndex: 1, locked: false, visible: true, config: { content: 'Escanea el QR de tu mesa', fontSize: 16, fontFamily: 'system-ui', color: '#666666', textAlign: 'center' } },
            { id: crypto.randomUUID(), type: 'image', x: 100, y: 220, width: 175, height: 175, zIndex: 2, locked: false, visible: true, config: { src: '', alt: 'Código QR', borderRadius: 12 } },
            { id: crypto.randomUUID(), type: 'text', x: 50, y: 420, width: 275, height: 40, zIndex: 3, locked: false, visible: true, config: { content: 'O ingresa tu número de mesa:', fontSize: 14, fontFamily: 'system-ui', color: '#666666', textAlign: 'center' } },
            { id: crypto.randomUUID(), type: 'table-input', x: 50, y: 480, width: 275, height: 56, zIndex: 4, locked: false, visible: true, config: { placeholder: 'N° de mesa', buttonLabel: 'Entrar', fontFamily: 'system-ui', fontSize: 16, fontWeight: 'normal', color: '#2A2A2A', backgroundColor: '#FFFFFF', borderColor: '#E5E5E5', borderRadius: 12, buttonVariant: 'primary' } },
          ], config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFF8F0' }, grid: { enabled: true, size: 8 } } },
          { id: 'table', name: 'Mesa Principal', type: 'table', icon: '🍽️', elements: [
            { id: crypto.randomUUID(), type: 'table-number', x: 20, y: 30, width: 335, height: 60, zIndex: 0, locked: false, visible: true, config: { prefix: 'Mesa ', fontSize: 36, fontWeight: 'bold', color: '#2A2A2A', textAlign: 'center' } },
            { id: crypto.randomUUID(), type: 'total-amount', x: 20, y: 100, width: 335, height: 50, zIndex: 1, locked: false, visible: true, config: { prefix: 'Total: ', fontSize: 24, fontWeight: 'bold', color: '#FF6B6B', textAlign: 'center' } },
            { id: crypto.randomUUID(), type: 'action-button', x: 20, y: 170, width: 335, height: 56, zIndex: 2, locked: false, visible: true, config: { action: 'viewMenu', label: 'Ver Menú', icon: 'utensils', variant: 'primary', size: 'lg', fullWidth: true } },
            { id: crypto.randomUUID(), type: 'action-button', x: 20, y: 240, width: 335, height: 56, zIndex: 3, locked: false, visible: true, config: { action: 'callWaiter', label: 'Llamar Mesero', icon: 'bell', variant: 'secondary', size: 'lg', fullWidth: true } },
            { id: crypto.randomUUID(), type: 'action-button', x: 20, y: 310, width: 335, height: 56, zIndex: 4, locked: false, visible: true, config: { action: 'viewBill', label: 'Ver Cuenta', icon: 'receipt', variant: 'outline', size: 'lg', fullWidth: true } },
            { id: crypto.randomUUID(), type: 'action-button', x: 20, y: 380, width: 335, height: 56, zIndex: 5, locked: false, visible: true, config: { action: 'requestBill', label: 'Pedir Cuenta', icon: 'dollar-sign', variant: 'primary', size: 'lg', fullWidth: true } },
            { id: crypto.randomUUID(), type: 'action-button', x: 20, y: 450, width: 335, height: 56, zIndex: 6, locked: false, visible: true, config: { action: 'scanAnother', label: 'Escanear otra mesa', icon: 'chevron-left', variant: 'ghost', size: 'md', fullWidth: true } },
          ], config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FFFFFF' }, grid: { enabled: true, size: 8 } } },
          { id: 'menu', name: 'Menú', type: 'menu', icon: '📖', elements: [
            { id: crypto.randomUUID(), type: 'action-button', x: 10, y: 8, width: 355, height: 40, zIndex: 0, locked: false, visible: true, config: { action: 'goBack', label: 'Volver', icon: 'chevron-left', variant: 'ghost', size: 'md', fullWidth: true } },
            { id: crypto.randomUUID(), type: 'category-tabs', x: 10, y: 56, width: 355, height: 48, zIndex: 1, locked: false, visible: true, config: {} },
            { id: crypto.randomUUID(), type: 'search-bar', x: 10, y: 112, width: 355, height: 44, zIndex: 2, locked: false, visible: true, config: { placeholder: 'Buscar platos...' } },
            { id: crypto.randomUUID(), type: 'menu-list', x: 10, y: 164, width: 355, height: 410, zIndex: 3, locked: false, visible: true, config: { layout: 'list', showCategoryTitle: true, showProductImage: true, showPrice: true } },
            { id: crypto.randomUUID(), type: 'cart-summary', x: 10, y: 582, width: 355, height: 60, zIndex: 4, locked: false, visible: true, config: { showItemCount: true, showTotal: true } },
          ].concat(legacyElements.map((el, i) => ({ ...el, zIndex: 5 + i }))), config: { page_format: 'mobile-portrait', background_config: t.background_config ? JSON.parse(t.background_config) : { type: 'color', value: '#FFFFFF' }, grid: { enabled: true, size: 8 } } },
          { id: 'bill', name: 'Cuenta', type: 'bill', icon: '🧾', elements: [
            { id: crypto.randomUUID(), type: 'text', x: 20, y: 16, width: 335, height: 36, zIndex: 0, locked: false, visible: true, config: { content: 'Cuenta Detallada', fontSize: 24, fontWeight: 'bold', color: '#2A2A2A', textAlign: 'center' } },
            { id: crypto.randomUUID(), type: 'table-number', x: 20, y: 60, width: 335, height: 32, zIndex: 1, locked: false, visible: true, config: { prefix: 'Mesa ', fontSize: 20, textAlign: 'center' } },
            { id: crypto.randomUUID(), type: 'bill-items', x: 10, y: 100, width: 355, height: 360, zIndex: 2, locked: false, visible: true, config: { showQuantity: true, showUnitPrice: true, showSubtotal: true } },
            { id: crypto.randomUUID(), type: 'total-amount', x: 20, y: 468, width: 335, height: 52, zIndex: 3, locked: false, visible: true, config: { prefix: 'Total a pagar: ', fontSize: 28, fontWeight: 'bold', color: '#FF6B6B', textAlign: 'center' } },
            { id: crypto.randomUUID(), type: 'action-button', x: 20, y: 528, width: 335, height: 52, zIndex: 4, locked: false, visible: true, config: { action: 'requestBill', label: 'Solicitar Cuenta para Pagar', icon: 'dollar-sign', variant: 'primary', size: 'lg', fullWidth: true } },
            { id: crypto.randomUUID(), type: 'action-button', x: 20, y: 588, width: 162, height: 52, zIndex: 5, locked: false, visible: true, config: { action: 'refreshBill', label: 'Actualizar', icon: 'refresh', variant: 'ghost', size: 'md', fullWidth: true } },
            { id: crypto.randomUUID(), type: 'action-button', x: 193, y: 588, width: 162, height: 52, zIndex: 6, locked: false, visible: true, config: { action: 'goBack', label: 'Volver', icon: 'chevron-left', variant: 'ghost', size: 'md', fullWidth: true } },
          ], config: { page_format: 'mobile-portrait', background_config: { type: 'color', value: '#FAFAFA' }, grid: { enabled: true, size: 8 } } },
        ];
        
        const newCanvasJson = JSON.stringify({ pages: defaultPages, globalConfig: JSON.parse(globalConfig) });
        
        await db.execute({
          sql: `UPDATE themes SET canvas_json = ?, config = ? WHERE id = ?`,
          args: [newCanvasJson, globalConfig, t.id],
        });
        
        console.log(`    ✅ "${t.name}" migrado a multi-page (${defaultPages.length} páginas)`);
      }
    } catch (e) { console.error('⚠️ Migración multi-page falló:', e.message || e); }

    // Migration: backfill table-input element on the scan page of every theme
    // (dev workaround for manual table entry until real QR scanning exists)
    try {
      const themes = await db.execute('SELECT id, name, canvas_json FROM themes');
      for (const theme of themes.rows) {
        if (!theme.canvas_json) continue;
        let canvas = null;
        try {
          canvas = typeof theme.canvas_json === 'string' ? JSON.parse(theme.canvas_json) : theme.canvas_json;
        } catch (_) { continue; }
        if (!canvas || !Array.isArray(canvas.pages)) continue;
        const scanPage = canvas.pages.find((p) => p.type === 'scan' || p.id === 'scan');
        if (!scanPage || !Array.isArray(scanPage.elements)) continue;
        if (scanPage.elements.some((el) => el.type === 'table-input')) continue;

        let maxBottom = 0;
        for (const el of scanPage.elements) {
          const bottom = (Number(el.y) || 0) + (Number(el.height) || 0);
          if (bottom > maxBottom) maxBottom = bottom;
        }
        scanPage.elements.push({
          id: crypto.randomUUID(),
          type: 'table-input',
          x: 50,
          y: maxBottom + 16,
          width: 275,
          height: 56,
          zIndex: scanPage.elements.length,
          locked: false,
          visible: true,
          config: { placeholder: 'N° de mesa', buttonLabel: 'Entrar', fontFamily: 'system-ui', fontSize: 16, fontWeight: 'normal', color: '#2A2A2A', backgroundColor: '#FFFFFF', borderColor: '#E5E5E5', borderRadius: 12, buttonVariant: 'primary' },
        });

        await db.execute({
          sql: 'UPDATE themes SET canvas_json = ? WHERE id = ?',
          args: [JSON.stringify(canvas), theme.id],
        });
        console.log(`    ✅ "${theme.name}" table-input agregado a la página scan`);
      }
    } catch (e) { console.error('⚠️ Migración table-input falló:', e.message || e); }

    // Migration: normalize menu + bill layouts (remove overlaps, harmonious spacing)
    // - menu: keep functional stack (tabs/search/list/cart), drop strays overlapping it,
    //   force mobile-portrait, list grows to fill available space
    // - bill: restack vertically only when content overflows the page
    try {
      const PAGE_DIMS = {
        'mobile-portrait': { width: 375, height: 667 },
        'mobile-landscape': { width: 667, height: 375 },
        'A4-portrait': { width: 794, height: 1123 },
        'A4-landscape': { width: 1123, height: 794 },
        Letter: { width: 816, height: 1056 },
      };
      const num = (v, fb) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
      const boxesOverlap = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

      const themes = await db.execute('SELECT id, name, canvas_json FROM themes');
      for (const theme of themes.rows) {
        if (!theme.canvas_json) continue;
        let canvas = null;
        try {
          canvas = typeof theme.canvas_json === 'string' ? JSON.parse(theme.canvas_json) : theme.canvas_json;
        } catch (_) { continue; }
        if (!canvas || !Array.isArray(canvas.pages)) continue;
        let dirty = false;

        // --- MENU page
        const menuPage = canvas.pages.find((p) => p.type === 'menu' || p.id === 'menu');
        if (menuPage && Array.isArray(menuPage.elements) && menuPage.elements.some((el) => el.type === 'menu-list')) {
          const order = ['category-tabs', 'search-bar', 'menu-list', 'cart-summary'];
          const fixedH = { 'category-tabs': 48, 'search-bar': 48, 'cart-summary': 60 };
          const byType = {};
          for (const el of menuPage.elements) {
            if (order.includes(el.type) && !byType[el.type]) byType[el.type] = el;
          }
          const present = order.filter((t) => byType[t]);
          if (present.length > 0) {
            const PW = 375, PH = 667, TOP = 12, GAP = 8, BOTTOM = 20;
            const othersH = present.filter((t) => t !== 'menu-list').reduce((s, t) => s + fixedH[t], 0);
            const listH = present.includes('menu-list')
              ? Math.max(200, PH - BOTTOM - TOP - othersH - GAP * present.length)
              : 0;
            let cursor = TOP;
            const stackBoxes = [];
            for (const t of present) {
              const el = byType[t];
              const h = t === 'menu-list' ? listH : fixedH[t];
              if (el.x !== 10 || el.y !== cursor || el.width !== 355 || el.height !== h) dirty = true;
              el.x = 10; el.y = cursor; el.width = 355; el.height = h;
              stackBoxes.push({ x: 10, y: cursor, width: 355, height: h });
              cursor += h + GAP;
            }
            const keepSet = new Set(present.map((t) => byType[t]));
            const kept = [];
            for (const el of menuPage.elements) {
              if (keepSet.has(el)) continue;
              const box = { x: num(el.x, 0), y: num(el.y, 0), width: num(el.width, 0), height: num(el.height, 0) };
              if (stackBoxes.some((s) => boxesOverlap(box, s)) || box.y + box.height > PH || box.x + box.width > PW) {
                dirty = true; // drop overlapping / off-page strays (legacy concat leftovers)
                continue;
              }
              kept.push(el);
            }
            if (menuPage.config?.page_format !== 'mobile-portrait') {
              menuPage.config = { ...(menuPage.config || {}), page_format: 'mobile-portrait' };
              dirty = true;
            }
            if (dirty) {
              [...present.map((t) => byType[t]), ...kept].forEach((el, i) => { el.zIndex = i; });
              menuPage.elements = [...present.map((t) => byType[t]), ...kept];
            }
          }
        }

        // --- BILL page (restack only on overflow)
        const billPage = canvas.pages.find((p) => p.type === 'bill' || p.id === 'bill');
        if (billPage && Array.isArray(billPage.elements) && billPage.elements.length > 0) {
          const dims = PAGE_DIMS[billPage.config?.page_format] || PAGE_DIMS['mobile-portrait'];
          const maxBottom = Math.max(...billPage.elements.map((el) => num(el.y, 0) + num(el.height, 0)));
          if (maxBottom > dims.height) {
            const GAP = 10, TOP = 20, SIDE = 10;
            const ordered = [...billPage.elements].sort((a, b) => num(a.y, 0) - num(b.y, 0));
            const overflow = TOP + ordered.reduce((s, el) => s + num(el.height, 0), 0) + GAP * (ordered.length - 1) + 16 - dims.height;
            if (overflow > 0) {
              const flex = ordered.find((el) => el.type === 'bill-items' || el.type === 'menu-list');
              if (flex) flex.height = Math.max(150, num(flex.height, 0) - overflow);
            }
            let y = TOP;
            ordered.forEach((el, i) => {
              el.width = Math.min(num(el.width, 100), dims.width - SIDE * 2);
              el.height = Math.max(num(el.height, 40), 24);
              el.x = Math.max(SIDE, Math.min(num(el.x, SIDE), dims.width - SIDE - el.width));
              el.y = y;
              el.zIndex = i;
              y += num(el.height, 0) + GAP;
            });
            dirty = true;
          }
        }

        if (dirty) {
          await db.execute({
            sql: 'UPDATE themes SET canvas_json = ? WHERE id = ?',
            args: [JSON.stringify(canvas), theme.id],
          });
          console.log(`    ✅ "${theme.name}" layout menu/bill normalizado`);
        }
      }
    } catch (e) { console.error('⚠️ Migración layout menu/bill falló:', e.message || e); }

    // Migration: normalize multi-page themes to canonical pre-canvas geometry
    // - MENU (has menu-list AND [stray overlap/off-page vs functional stack OR format != mobile-portrait OR no goBack]):
    //   rebuild canonical geometry preserving ids/configs, drop overlapping/off-page strays, force mobile-portrait, append goBack if missing.
    // - BILL (has bill-items AND [bottom overflow OR missing refreshBill/goBack OR has viewMenu button]):
    //   rebuild canonical preserving ids/configs, drop other action-buttons, append actualizar + volver.
    // - SCAN (has table-input AND scanAnother button): remove scanAnother button(s).
    try {
      const PAGE_W = 375;
      const PAGE_H = 667;
      const num = (v, fb) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
      const boxesOverlap = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
      const isGoBack = (el) => el && el.type === 'action-button' && el.config && el.config.action === 'goBack';
      const buttonAction = (el) => (el && el.type === 'action-button' && el.config && el.config.action) || null;

      const MENU_SLOTS = [
        { key: 'goBack', geo: { x: 10, y: 8, width: 355, height: 40 } },
        { key: 'category-tabs', geo: { x: 10, y: 56, width: 355, height: 48 } },
        { key: 'search-bar', geo: { x: 10, y: 112, width: 355, height: 44 } },
        { key: 'menu-list', geo: { x: 10, y: 164, width: 355, height: 410 } },
        { key: 'cart-summary', geo: { x: 10, y: 582, width: 355, height: 60 } },
      ];
      const BILL_SLOTS = [
        { key: 'title', geo: { x: 20, y: 16, width: 335, height: 36 } },
        { key: 'table-number', geo: { x: 20, y: 60, width: 335, height: 32 } },
        { key: 'bill-items', geo: { x: 10, y: 100, width: 355, height: 360 } },
        { key: 'total-amount', geo: { x: 20, y: 468, width: 335, height: 52 } },
        { key: 'requestBill', geo: { x: 20, y: 528, width: 335, height: 52 } },
        { key: 'refreshBill', geo: { x: 20, y: 588, width: 162, height: 52 } },
        { key: 'goBack', geo: { x: 193, y: 588, width: 162, height: 52 } },
      ];

      const themes = await db.execute('SELECT id, name, canvas_json FROM themes');
      for (const theme of themes.rows) {
        if (!theme.canvas_json) continue;
        let canvas = null;
        try {
          canvas = typeof theme.canvas_json === 'string' ? JSON.parse(theme.canvas_json) : theme.canvas_json;
        } catch (_) { continue; }
        if (!canvas || !Array.isArray(canvas.pages)) continue;
        let dirty = false;
        const notes = [];

        // --- SCAN page: drop scanAnother button(s) when table-input exists
        const scanPage = canvas.pages.find((p) => p.type === 'scan' || p.id === 'scan');
        if (scanPage && Array.isArray(scanPage.elements) && scanPage.elements.some((el) => el.type === 'table-input')) {
          const before = scanPage.elements.length;
          scanPage.elements = scanPage.elements.filter((el) => buttonAction(el) !== 'scanAnother');
          if (scanPage.elements.length !== before) {
            scanPage.elements.forEach((el, i) => { el.zIndex = i; });
            dirty = true;
            notes.push('scan: scanAnother removido');
          }
        }

        // --- MENU page
        const menuPage = canvas.pages.find((p) => p.type === 'menu' || p.id === 'menu');
        if (menuPage && Array.isArray(menuPage.elements) && menuPage.elements.some((el) => el.type === 'menu-list')) {
          const firstOf = (pred) => menuPage.elements.find(pred) || null;
          const found = {
            goBack: firstOf(isGoBack),
            'category-tabs': firstOf((el) => el.type === 'category-tabs'),
            'search-bar': firstOf((el) => el.type === 'search-bar'),
            'menu-list': firstOf((el) => el.type === 'menu-list'),
            'cart-summary': firstOf((el) => el.type === 'cart-summary'),
          };
          const functionalSet = new Set(Object.values(found).filter(Boolean));
          const stackBoxes = MENU_SLOTS.map((s) => ({ ...s.geo }));
          let strayProblem = false;
          for (const el of menuPage.elements) {
            if (functionalSet.has(el)) continue;
            const box = { x: num(el.x, 0), y: num(el.y, 0), width: num(el.width, 0), height: num(el.height, 0) };
            if (stackBoxes.some((s) => boxesOverlap(box, s)) || box.x + box.width > PAGE_W || box.y + box.height > PAGE_H) {
              strayProblem = true;
              break;
            }
          }
          const needsMenu = strayProblem || menuPage.config?.page_format !== 'mobile-portrait' || !found.goBack;
          if (needsMenu) {
            const keptStrays = [];
            for (const el of menuPage.elements) {
              if (functionalSet.has(el)) continue;
              const box = { x: num(el.x, 0), y: num(el.y, 0), width: num(el.width, 0), height: num(el.height, 0) };
              if (stackBoxes.some((s) => boxesOverlap(box, s)) || box.x + box.width > PAGE_W || box.y + box.height > PAGE_H) continue;
              keptStrays.push(el);
            }
            const rebuilt = [];
            MENU_SLOTS.forEach((slot, i) => {
              let el = found[slot.key];
              if (!el) {
                el = slot.key === 'goBack'
                  ? { id: crypto.randomUUID(), type: 'action-button', locked: false, visible: true, config: { action: 'goBack', label: 'Volver', icon: 'chevron-left', variant: 'ghost', size: 'md', fullWidth: true } }
                  : { id: crypto.randomUUID(), type: slot.key, locked: false, visible: true, config: {} };
              }
              el.x = slot.geo.x; el.y = slot.geo.y; el.width = slot.geo.width; el.height = slot.geo.height;
              el.zIndex = i;
              if (el.visible === undefined) el.visible = true;
              rebuilt.push(el);
            });
            keptStrays.forEach((el, i) => { el.zIndex = rebuilt.length + i; });
            menuPage.elements = [...rebuilt, ...keptStrays];
            menuPage.config = { ...(menuPage.config || {}), page_format: 'mobile-portrait' };
            dirty = true;
            notes.push('menu: geometria canonica restaurada');
          }
        }

        // --- BILL page
        const billPage = canvas.pages.find((p) => p.type === 'bill' || p.id === 'bill');
        if (billPage && Array.isArray(billPage.elements) && billPage.elements.some((el) => el.type === 'bill-items')) {
          const actions = billPage.elements.map(buttonAction).filter(Boolean);
          const maxBottom = Math.max(...billPage.elements.map((el) => num(el.y, 0) + num(el.height, 0)));
          const needsBill = maxBottom > PAGE_H || !actions.includes('refreshBill') || !actions.includes('goBack') || actions.includes('viewMenu');
          if (needsBill) {
            const pick = (pred) => billPage.elements.find(pred) || null;
            const titleEl = pick((el) => el.type === 'text');
            const tableEl = pick((el) => el.type === 'table-number');
            const itemsEl = pick((el) => el.type === 'bill-items');
            const totalEl = pick((el) => el.type === 'total-amount');
            const requestEl = pick((el) => buttonAction(el) === 'requestBill');
            let refreshEl = pick((el) => buttonAction(el) === 'refreshBill');
            let backEl = pick((el) => buttonAction(el) === 'goBack');
            if (!refreshEl) refreshEl = { id: crypto.randomUUID(), type: 'action-button', locked: false, visible: true, config: { action: 'refreshBill', label: 'Actualizar', icon: 'refresh', variant: 'ghost', size: 'md', fullWidth: true } };
            if (!backEl) backEl = { id: crypto.randomUUID(), type: 'action-button', locked: false, visible: true, config: { action: 'goBack', label: 'Volver', icon: 'chevron-left', variant: 'ghost', size: 'md', fullWidth: true } };
            const slotSources = { title: titleEl, 'table-number': tableEl, 'bill-items': itemsEl, 'total-amount': totalEl, requestBill: requestEl, refreshBill: refreshEl, goBack: backEl };
            const rebuilt = BILL_SLOTS.map((slot, i) => {
              let el = slotSources[slot.key];
              if (!el) {
                el = { id: crypto.randomUUID(), type: slot.key === 'title' ? 'text' : slot.key, locked: false, visible: true, config: {} };
              }
              el.x = slot.geo.x; el.y = slot.geo.y; el.width = slot.geo.width; el.height = slot.geo.height;
              el.zIndex = i;
              if (el.visible === undefined) el.visible = true;
              return el;
            });
            billPage.elements = rebuilt;
            billPage.config = { ...(billPage.config || {}), page_format: 'mobile-portrait' };
            dirty = true;
            notes.push('bill: geometria canonica restaurada');
          }
        }

        if (dirty) {
          await db.execute({
            sql: 'UPDATE themes SET canvas_json = ? WHERE id = ?',
            args: [JSON.stringify(canvas), theme.id],
          });
          console.log(`    ✅ "${theme.name}" normalizado (${notes.join('; ')})`);
        }
      }
    } catch (e) { console.error('⚠️ Migración canonica pre-canvas falló:', e.message || e); }

    console.log('✅ Tablas inicializadas correctamente');
  } catch (error) {
    console.error('❌ Error inicializando tablas:', error);
    throw error;
  }
}

module.exports = { db, initializeDatabase };
