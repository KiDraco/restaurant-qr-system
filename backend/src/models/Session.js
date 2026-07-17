const { db } = require('../config/database');

class Session {
  static create(tableNumber) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO table_sessions (table_number) VALUES (?)',
        [tableNumber],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, tableNumber });
        }
      );
    });
  }

  static getActiveByTable(tableNumber) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM table_sessions 
         WHERE table_number = ? AND status = 'active' 
         ORDER BY session_start DESC LIMIT 1`,
        [tableNumber],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static close(sessionId) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE table_sessions 
         SET status = 'closed', session_end = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [sessionId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  static updateTotal(sessionId, amount) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE table_sessions 
         SET total_amount = total_amount + ? 
         WHERE id = ?`,
        [amount, sessionId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  static getAllActive() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM table_sessions 
         WHERE status = 'active' 
         ORDER BY session_start DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = Session;