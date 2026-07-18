const { db } = require('../config/database');

class Request {
  static async create(tableNumber, requestType) {
    const result = await db.execute({
      sql: 'INSERT INTO requests (table_number, request_type) VALUES (?, ?)',
      args: [tableNumber, requestType]
    });
    return { id: result.lastInsertRowid, tableNumber, requestType };
  }

  static async getPending() {
    const result = await db.execute(
      `SELECT * FROM requests 
       WHERE status = 'pending' 
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  static async markAsAttended(id) {
    const result = await db.execute({
      sql: `UPDATE requests 
            SET status = 'attended', attended_at = CURRENT_TIMESTAMP 
            WHERE id = ?`,
      args: [id]
    });
    return result.rowsAffected > 0;
  }

  static async getStats() {
    const result = await db.execute({
      sql: `SELECT 
              COUNT(*) as total_requests,
              SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
              SUM(CASE WHEN status = 'attended' THEN 1 ELSE 0 END) as attended,
              SUM(CASE WHEN request_type = 'call_waiter' THEN 1 ELSE 0 END) as waiter_calls,
              SUM(CASE WHEN request_type = 'request_bill' THEN 1 ELSE 0 END) as bill_requests
            FROM requests 
            WHERE DATE(created_at) = DATE('now')`,
      args: []
    });
    return result.rows[0] || null;
  }
}

module.exports = Request;
