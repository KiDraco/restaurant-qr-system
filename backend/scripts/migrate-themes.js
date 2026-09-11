require('dotenv').config();
const { db } = require('../src/config/database');

async function migrateThemes() {
  console.log('🗃️  Ejecutando migración: tabla themes...\n');

  try {
    // 1. Crear tabla themes
    await db.execute({
      sql: `
        CREATE TABLE IF NOT EXISTS themes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 0,
          is_default BOOLEAN DEFAULT 0,
          config JSON NOT NULL DEFAULT '{"logo_url":null,"colors":null,"font_family":null,"background_type":"color","background_value":null}',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
      args: []
    });

    // 2. Índice para búsquedas por nombre (case-insensitive simplificado)
    try {
      await db.execute({
        sql: 'CREATE INDEX IF NOT EXISTS idx_themes_name_lower ON themes (lower(name))',
        args: []
      });
    } catch (e) {
      // Índice opcional, no bloquea migración
    }

    // 3. Asegurar fila default si no existe
    const existing = await db.execute({
      sql: 'SELECT COUNT(*) AS count FROM themes',
      args: []
    });
    const count = Number(existing.rows[0].count);
    if (count === 0) {
      await db.execute({
        sql: `
          INSERT INTO themes (name, config, is_default, is_active)
          VALUES ('Default', '{"logo_url":null,"colors":null,"font_family":"system","background_type":"color","background_value":"#FFFFFF"}', 1, 1)
        `,
        args: []
      });
      console.log('✔ Fila default insertada en themes');
    }

    console.log('✅ Migración themes completada satisfactoriamente\n');
  } catch (error) {
    console.error('❌ Error en migración themes:', error);
    throw error;
  }
}

migrateThemes();
module.exports = migrateThemes;