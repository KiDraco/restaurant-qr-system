const { db } = require('../config/database');

class MenuItem {
  static async create(name, description, price, category) {
    const result = await db.execute({
      sql: 'INSERT INTO menu_items (name, description, price, category) VALUES (?, ?, ?, ?)',
      args: [name, description, price, category]
    });
    return { id: result.lastInsertRowid, name, description, price, category };
  }

  static async getAll(category = null) {
    let sql = 'SELECT * FROM menu_items WHERE available = 1';
    let args = [];

    if (category) {
      sql += ' AND category = ?';
      args.push(category);
    }

    sql += ' ORDER BY category, name';

    const result = await db.execute({ sql, args });
    return result.rows;
  }

  static async findById(id) {
    const result = await db.execute({
      sql: 'SELECT * FROM menu_items WHERE id = ?',
      args: [id]
    });
    return result.rows[0] || null;
  }

  static async update(id, data) {
    const { name, description, price, category, available } = data;
    const result = await db.execute({
      sql: `UPDATE menu_items 
            SET name = COALESCE(?, name), 
                description = COALESCE(?, description),
                price = COALESCE(?, price),
                category = COALESCE(?, category),
                available = COALESCE(?, available)
            WHERE id = ?`,
      args: [name ?? null, description ?? null, price ?? null, category ?? null, available ?? null, id]
    });
    return result.rowsAffected > 0;
  }

  static async delete(id) {
    const result = await db.execute({
      sql: 'UPDATE menu_items SET available = 0 WHERE id = ?',
      args: [id]
    });
    return result.rowsAffected > 0;
  }
}

module.exports = MenuItem;
