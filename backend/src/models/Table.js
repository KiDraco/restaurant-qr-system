const { db } = require('../config/database');

class Table {
  static async create(tableNumber, qrCode) {
    const result = await db.execute({
      sql: 'INSERT INTO tables (table_number, qr_code) VALUES (?, ?)',
      args: [tableNumber, qrCode]
    });
    return { id: result.lastInsertRowid, tableNumber, qrCode };
  }

  static async findByQRCode(qrCode) {
    const result = await db.execute({
      sql: 'SELECT * FROM tables WHERE qr_code = ?',
      args: [qrCode]
    });
    return result.rows[0] || null;
  }

  static async findByNumber(tableNumber) {
    const result = await db.execute({
      sql: 'SELECT * FROM tables WHERE table_number = ?',
      args: [tableNumber]
    });
    return result.rows[0] || null;
  }

  static async getAll() {
    const result = await db.execute('SELECT * FROM tables ORDER BY table_number');
    return result.rows;
  }

  static async updateStatus(tableNumber, status) {
    const result = await db.execute({
      sql: 'UPDATE tables SET status = ? WHERE table_number = ?',
      args: [status, tableNumber]
    });
    return result.rowsAffected > 0;
  }
}

module.exports = Table;
