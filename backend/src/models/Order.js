const { db } = require('../config/database');

class Order {
  static async create(sessionId, tableNumber, menuItemId, quantity, unitPrice, subtotal) {
    const result = await db.execute({
      sql: `INSERT INTO orders (session_id, table_number, menu_item_id, quantity, unit_price, subtotal) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [sessionId, tableNumber, menuItemId, quantity, unitPrice, subtotal]
    });
    return { id: result.lastInsertRowid, sessionId, tableNumber, menuItemId, quantity, subtotal };
  }

  static async getBySession(sessionId) {
    const result = await db.execute({
      sql: `SELECT 
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
      args: [sessionId]
    });
    return result.rows;
  }

  static async getByTable(tableNumber) {
    const result = await db.execute({
      sql: `SELECT 
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
      args: [tableNumber, tableNumber]
    });
    return result.rows;
  }

  static async getSalesStats() {
    const result = await db.execute({
      sql: `SELECT 
              COUNT(DISTINCT session_id) as total_sessions,
              COUNT(*) as total_orders,
              SUM(subtotal) as total_sales
            FROM orders 
            WHERE DATE(created_at) = DATE('now')`,
      args: []
    });
    return result.rows[0] || null;
  }
}

module.exports = Order;
