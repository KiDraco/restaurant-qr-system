const { db } = require('../config/database');

class MenuItem {
  static create(name, description, price, category) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO menu_items (name, description, price, category) VALUES (?, ?, ?, ?)',
        [name, description, price, category],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, name, description, price, category });
        }
      );
    });
  }

  static getAll(category = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM menu_items WHERE available = 1';
      let params = [];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      query += ' ORDER BY category, name';

      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM menu_items WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static update(id, data) {
    return new Promise((resolve, reject) => {
      const { name, description, price, category, available } = data;
      db.run(
        `UPDATE menu_items 
         SET name = COALESCE(?, name), 
             description = COALESCE(?, description),
             price = COALESCE(?, price),
             category = COALESCE(?, category),
             available = COALESCE(?, available)
         WHERE id = ?`,
        [name, description, price, category, available, id],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE menu_items SET available = 0 WHERE id = ?',
        [id],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }
}

module.exports = MenuItem;