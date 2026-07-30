const { db } = require('../config/database');

class MenuItem {
  static async create(name, description, price, category, image_url = null) {
    const result = await db.execute({
      sql: 'INSERT INTO menu_items (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)',
      args: [name, description, price, category, image_url]
    });
    return { id: result.lastInsertRowid, name, description, price, category, image_url };
  }

  static async getAll(category = null, showAll = false) {
    let sql = 'SELECT * FROM menu_items';
    let args = [];

    if (!showAll) {
      sql += ' WHERE available = 1';
    }

    if (category) {
      sql += `${!showAll ? ' AND' : ' WHERE'} category = ?`;
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
    const { name, description, price, category, available, image_url } = data;
    const result = await db.execute({
      sql: `UPDATE menu_items 
            SET name = COALESCE(?, name), 
                description = COALESCE(?, description),
                price = COALESCE(?, price),
                category = COALESCE(?, category),
                available = COALESCE(?, available),
                image_url = COALESCE(?, image_url)
            WHERE id = ?`,
      args: [name ?? null, description ?? null, price ?? null, category ?? null, available ?? null, image_url ?? null, id]
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
