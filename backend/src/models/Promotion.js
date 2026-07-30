const { db } = require('../config/database');

class Promotion {
  static async create(name, description, discount_percentage, image_url, start_date, end_date) {
    const result = await db.execute({
      sql: 'INSERT INTO promotions (name, description, discount_percentage, image_url, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
      args: [name, description, discount_percentage, image_url, start_date, end_date]
    });
    return { id: result.lastInsertRowid, name, description, discount_percentage, image_url, start_date, end_date };
  }

  static async getAll() {
    const result = await db.execute({
      sql: 'SELECT * FROM promotions ORDER BY created_at DESC'
    });
    return result.rows;
  }

  static async getActive() {
    const result = await db.execute({
      sql: "SELECT * FROM promotions WHERE active = 1 AND (end_date IS NULL OR end_date >= date('now')) ORDER BY created_at DESC"
    });
    return result.rows;
  }

  static async findById(id) {
    const result = await db.execute({
      sql: 'SELECT * FROM promotions WHERE id = ?',
      args: [id]
    });
    return result.rows[0] || null;
  }

  static async update(id, data) {
    const { name, description, discount_percentage, image_url, start_date, end_date, active } = data;
    const result = await db.execute({
      sql: `UPDATE promotions
            SET name = COALESCE(?, name),
                description = COALESCE(?, description),
                discount_percentage = COALESCE(?, discount_percentage),
                image_url = COALESCE(?, image_url),
                start_date = COALESCE(?, start_date),
                end_date = COALESCE(?, end_date),
                active = COALESCE(?, active)
            WHERE id = ?`,
      args: [name ?? null, description ?? null, discount_percentage ?? null, image_url ?? null, start_date ?? null, end_date ?? null, active ?? null, id]
    });
    return result.rowsAffected > 0;
  }

  static async delete(id) {
    const result = await db.execute({
      sql: 'UPDATE promotions SET active = 0 WHERE id = ?',
      args: [id]
    });
    return result.rowsAffected > 0;
  }
}

module.exports = Promotion;
