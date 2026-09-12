const { db } = require('../config/database');

class Theme {
  static async findActive() {
    const result = await db.execute({
      sql: 'SELECT * FROM themes WHERE is_active = 1 LIMIT 1',
      args: [],
    });
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await db.execute({
      sql: 'SELECT * FROM themes WHERE id = ?',
      args: [id],
    });
    return result.rows[0] || null;
  }

  static async findAll() {
    const result = await db.execute({
      sql: 'SELECT id, name, is_active, is_default, page_format, background_config, canvas_json, created_at FROM themes ORDER BY is_active DESC, name ASC',
      args: [],
    });
    return result.rows || [];
  }

  static async create(name, config, isDefault = false, canvasJson = null, pageFormat = 'A4-portrait', backgroundConfig = null) {
    const result = await db.execute({
      sql: `INSERT INTO themes (name, config, is_default, is_active, canvas_json, page_format, background_config) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [name, JSON.stringify(config), isDefault, false, canvasJson, pageFormat, backgroundConfig ? JSON.stringify(backgroundConfig) : JSON.stringify({ type: 'color', value: '#FFFFFF' })],
    });
    return { id: result.lastInsertRowid, name, config, is_active: false, canvas_json: canvasJson, page_format: pageFormat, background_config: backgroundConfig };
  }

  static async activate(id) {
    // Desactiva todos los demás primero
    await db.execute({
      sql: 'UPDATE themes SET is_active = 0',
      args: [],
    });
    // Activa el seleccionado
    const result = await db.execute({
      sql: 'UPDATE themes SET is_active = 1 WHERE id = ?',
      args: [id],
    });
    return result.affectedRows > 0;
  }

  static async update(id, name, config, canvasJson = null, pageFormat = null, backgroundConfig = null) {
    const updates = [];
    const args = [];

    if (name !== undefined) {
      updates.push('name = ?');
      args.push(name);
    }
    if (config !== undefined) {
      updates.push('config = ?');
      args.push(JSON.stringify(config));
    }
    if (canvasJson !== undefined) {
      updates.push('canvas_json = ?');
      args.push(canvasJson);
    }
    if (pageFormat !== undefined) {
      updates.push('page_format = ?');
      args.push(pageFormat);
    }
    if (backgroundConfig !== undefined) {
      updates.push('background_config = ?');
      args.push(backgroundConfig ? JSON.stringify(backgroundConfig) : null);
    }

    if (updates.length === 0) {
      return false;
    }

    args.push(id);
    const result = await db.execute({
      sql: `UPDATE themes SET ${updates.join(', ')} WHERE id = ?`,
      args,
    });
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const result = await db.execute({
      sql: 'DELETE FROM themes WHERE id = ?',
      args: [id],
    });
    return result.affectedRows > 0;
  }

  static async getConfig(id) {
    const result = await db.execute({
      sql: 'SELECT config, canvas_json, background_config FROM themes WHERE id = ?',
      args: [id],
    });
    const row = result.rows[0];
    if (!row) return null;

    // Legacy config (colors/fonts)
    const legacyConfig = row.config ? JSON.parse(row.config) : {};

    // Canvas config takes precedence
    if (row.canvas_json) {
      try {
        const canvas = JSON.parse(row.canvas_json);
        const canvasConfig = {};

        // Extract colors from canvas background
        if (canvas.background_config) {
          canvasConfig.background = canvas.background_config;
        }

        // Extract fonts from first text/category element as fallback
        if (canvas.elements && canvas.elements.length > 0) {
          const textEl = canvas.elements.find(e => e.type === 'text' || e.type === 'category');
          if (textEl && textEl.config) {
            if (textEl.config.fontFamily) canvasConfig.font_family = textEl.config.fontFamily;
            if (textEl.config.color) canvasConfig.colors = { ...legacyConfig.colors, text: textEl.config.color };
          }
        }

        // Merge: canvas takes precedence over legacy
        return { ...legacyConfig, ...canvasConfig, background_config: canvas.background_config };
      } catch (e) {
        // If canvas_json is malformed, fall back to legacy
        console.warn('Failed to parse canvas_json for theme', id, e.message);
      }
    }

    // Fallback to legacy config
    return legacyConfig;
  }
}

module.exports = Theme;