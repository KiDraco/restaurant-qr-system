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
      sql: 'SELECT id, name, is_active, is_default, created_at FROM themes ORDER BY is_active DESC, name ASC',
      args: [],
    });
    return result.rows || [];
  }

  static async create(name, config, isDefault = false) {
    const result = await db.execute({
      sql: 'INSERT INTO themes (name, config, is_default, is_active) VALUES (?, ?, ?, ?)',
      args: [name, JSON.stringify(config), isDefault, false],
    });
    return { id: result.lastInsertRowid, name, config, is_active: false };
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

  static async update(id, name, config) {
    const result = await db.execute({
      sql: 'UPDATE themes SET name = ?, config = ? WHERE id = ?',
      args: [name, JSON.stringify(config), id],
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
      sql: 'SELECT config FROM themes WHERE id = ?',
      args: [id],
    });
    return result.rows[0] && result.rows[0].config ? JSON.parse(result.rows[0].config) : null;
  }
}

module.exports = Theme;