const { db } = require('../config/database');

class Request {
  static create(tableNumber, requestType) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO requests (table_number, request_type) VALUES (?, ?)',
        [tableNumber, requestType],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, tableNumber, requestType });
        }
      );
    });
  }

  static getPending() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM requests 
         WHERE status = 'pending' 
         ORDER BY created_at DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static markAsAttended(id) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE requests 
         SET status = 'attended', attended_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [id],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  static getStats() {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          COUNT(*) as total_requests,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'attended' THEN 1 ELSE 0 END) as attended,
          SUM(CASE WHEN request_type = 'call_waiter' THEN 1 ELSE 0 END) as waiter_calls,
          SUM(CASE WHEN request_type = 'request_bill' THEN 1 ELSE 0 END) as bill_requests
        FROM requests 
        WHERE DATE(created_at) = DATE('now')`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }
}

module.exports = Request;