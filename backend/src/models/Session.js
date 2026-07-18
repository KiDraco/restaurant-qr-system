const { db } = require('../config/database');

class Session {
  static async create(tableNumber) {
    const result = await db.execute({
      sql: 'INSERT INTO table_sessions (table_number) VALUES (?)',
      args: [tableNumber]
    });
    return { id: result.lastInsertRowid, tableNumber };
  }

  static async getActiveByTable(tableNumber) {
    const result = await db.execute({
      sql: `SELECT * FROM table_sessions 
            WHERE table_number = ? AND status = 'active' 
            ORDER BY session_start DESC LIMIT 1`,
      args: [tableNumber]
    });
    return result.rows[0] || null;
  }

  static async close(sessionId) {
    const result = await db.execute({
      sql: `UPDATE table_sessions 
            SET status = 'closed', session_end = CURRENT_TIMESTAMP 
            WHERE id = ?`,
      args: [sessionId]
    });
    return result.rowsAffected > 0;
  }

  static async updateTotal(sessionId, amount) {
    const result = await db.execute({
      sql: `UPDATE table_sessions 
            SET total_amount = total_amount + ? 
            WHERE id = ?`,
      args: [amount, sessionId]
    });
    return result.rowsAffected > 0;
  }

  static async getAllActive() {
    const result = await db.execute(
      `SELECT * FROM table_sessions 
       WHERE status = 'active' 
       ORDER BY session_start DESC`
    );
    return result.rows;
  }
}

module.exports = Session;
