const { db } = require('../config/database');

class Table {
  static create(tableNumber, qrCode) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO tables (table_number, qr_code) VALUES (?, ?)',
        [tableNumber, qrCode],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, tableNumber, qrCode });
        }
      );
    });
  }

  static findByQRCode(qrCode) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM tables WHERE qr_code = ?',
        [qrCode],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static findByNumber(tableNumber) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM tables WHERE table_number = ?',
        [tableNumber],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM tables ORDER BY table_number',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static updateStatus(tableNumber, status) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE tables SET status = ? WHERE table_number = ?',
        [status, tableNumber],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }
}

module.exports = Table;