const { db } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await db.execute({
      sql: 'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      args: [id]
    });
    return result.rows[0] || null;
  }

  static async create(name, email, password, role = 'staff') {
    const password_hash = bcrypt.hashSync(password, 10);
    const result = await db.execute({
      sql: 'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      args: [name, email, password_hash, role]
    });
    return { id: result.lastInsertRowid, name, email, role };
  }

  static verifyPassword(plainPassword, passwordHash) {
    return bcrypt.compareSync(plainPassword, passwordHash);
  }

  static async count() {
    const result = await db.execute('SELECT COUNT(*) AS count FROM users');
    return Number(result.rows[0].count);
  }
}

module.exports = User;
