const Order = require('../models/Order');
const Session = require('../models/Session');
const MenuItem = require('../models/MenuItem');

class OrderController {
  async createOrder(req, res, next) {
    try {
      const { tableNumber, menuItemId, quantity } = req.body;

      if (!tableNumber || !menuItemId || !quantity) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      // Obtener sesión activa
      const session = await Session.getActiveByTable(tableNumber);
      if (!session) {
        return res.status(404).json({ error: 'No hay sesión activa para esta mesa' });
      }

      // Obtener precio del producto
      const menuItem = await MenuItem.findById(menuItemId);
      if (!menuItem) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const subtotal = menuItem.price * quantity;

      // Crear la orden
      const order = await Order.create(
        session.id,
        tableNumber,
        menuItemId,
        quantity,
        menuItem.price,
        subtotal
      );

      // Actualizar el total de la sesión
      await Session.updateTotal(session.id, subtotal);

      res.json({
        message: 'Orden agregada',
        orderId: order.id,
        subtotal
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrdersByTable(req, res, next) {
    try {
      const { tableNumber } = req.params;
      const orders = await Order.getByTable(tableNumber);
      res.json(orders);
    } catch (error) {
      next(error);
    }
  }

  async getSalesStats(req, res, next) {
    try {
      const stats = await Order.getSalesStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();