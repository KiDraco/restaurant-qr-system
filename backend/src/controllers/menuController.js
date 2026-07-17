const MenuItem = require('../models/MenuItem');

class MenuController {
  async createMenuItem(req, res, next) {
    try {
      const { name, description, price, category } = req.body;

      if (!name || !price || !category) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      const menuItem = await MenuItem.create(name, description, price, category);

      res.json({
        message: 'Producto agregado',
        item: menuItem
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllMenuItems(req, res, next) {
    try {
      const { category } = req.query;
      const items = await MenuItem.getAll(category);
      res.json(items);
    } catch (error) {
      next(error);
    }
  }

  async getMenuItemById(req, res, next) {
    try {
      const { id } = req.params;
      const item = await MenuItem.findById(id);

      if (!item) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      res.json(item);
    } catch (error) {
      next(error);
    }
  }

  async updateMenuItem(req, res, next) {
    try {
      const { id } = req.params;
      const success = await MenuItem.update(id, req.body);

      if (!success) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      res.json({ message: 'Producto actualizado' });
    } catch (error) {
      next(error);
    }
  }

  async deleteMenuItem(req, res, next) {
    try {
      const { id } = req.params;
      const success = await MenuItem.delete(id);

      if (!success) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      res.json({ message: 'Producto eliminado' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MenuController();