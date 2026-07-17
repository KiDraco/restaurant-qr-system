const Session = require('../models/Session');
const Order = require('../models/Order');

class SessionController {
  async startSession(req, res, next) {
    try {
      const { tableNumber } = req.body;

      if (!tableNumber) {
        return res.status(400).json({ error: 'Número de mesa requerido' });
      }

      // Verificar si ya hay una sesión activa
      const existingSession = await Session.getActiveByTable(tableNumber);
      if (existingSession) {
        return res.json({
          message: 'Sesión ya activa',
          sessionId: existingSession.id,
          tableNumber
        });
      }

      const session = await Session.create(tableNumber);

      res.json({
        message: 'Sesión iniciada',
        sessionId: session.id,
        tableNumber
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveSession(req, res, next) {
    try {
      const { tableNumber } = req.params;
      const session = await Session.getActiveByTable(tableNumber);

      if (!session) {
        return res.status(404).json({ error: 'No hay sesión activa' });
      }

      res.json(session);
    } catch (error) {
      next(error);
    }
  }

  async getBill(req, res, next) {
    try {
      const { tableNumber } = req.params;
      const session = await Session.getActiveByTable(tableNumber);

      if (!session) {
        return res.status(404).json({ error: 'No hay sesión activa' });
      }

      const orders = await Order.getBySession(session.id);

      res.json({
        sessionId: session.id,
        tableNumber: session.table_number,
        sessionStart: session.session_start,
        totalAmount: session.total_amount,
        orders,
        itemCount: orders.length
      });
    } catch (error) {
      next(error);
    }
  }

  async closeSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const success = await Session.close(sessionId);

      if (!success) {
        return res.status(404).json({ error: 'Sesión no encontrada' });
      }

      res.json({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  async getAllActiveSessions(req, res, next) {
    try {
      const sessions = await Session.getAllActive();
      res.json(sessions);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SessionController();