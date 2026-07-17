const { db } = require('../config/database');

class Order {
  static create(sessionId, tableNumber, menuItemId, quantity, unitPrice, subtotal) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO orders (session_id, table_number, menu_item_id, quantity, unit_price, subtotal) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sessionId, tableNumber, menuItemId, quantity, unitPrice, subtotal],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, sessionId, tableNumber, menuItemId, quantity, subtotal });
        }
      );
    });
  }

  static getBySession(sessionId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          o.id,
          o.quantity,
          o.unit_price,
          o.subtotal,
          o.status,
          o.created_at,
          mi.name as item_name,
          mi.category
         FROM orders o
         JOIN menu_items mi ON o.menu_item_id = mi.id
         WHERE o.session_id = ?
         ORDER BY o.created_at DESC`,
        [sessionId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static getByTable(tableNumber) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          o.id,
          o.quantity,
          o.unit_price,
          o.subtotal,
          o.status,
          o.created_at,
          mi.name as item_name,
          mi.category
         FROM orders o
         JOIN menu_items mi ON o.menu_item_id = mi.id
         WHERE o.table_number = ?
         AND o.session_id IN (
           SELECT id FROM table_sessions WHERE table_number = ? AND status = 'active'
         )
         ORDER BY o.created_at DESC`,
        [tableNumber, tableNumber],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static getSalesStats() {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          COUNT(DISTINCT session_id) as total_sessions,
          COUNT(*) as total_orders,
          SUM(subtotal) as total_sales
         FROM orders 
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

module.exports = Order;