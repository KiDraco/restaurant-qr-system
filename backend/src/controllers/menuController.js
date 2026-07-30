const MenuItem = require('../models/MenuItem');
const ExcelParser = require('../services/excelParser');

class MenuController {
  async createMenuItem(req, res, next) {
    try {
      const { name, description, price, category, image_url } = req.body;

      if (!name || !price || !category) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      const menuItem = await MenuItem.create(name, description, price, category, image_url);

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

  async importParse(req, res, next) {
    try {
      const { fileBase64 } = req.body;
      if (!fileBase64) {
        return res.status(400).json({ error: 'Archivo requerido' });
      }

      const buffer = Buffer.from(fileBase64, 'base64');
      const result = ExcelParser.parse(buffer);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async importConfirm(req, res, next) {
    try {
      const { mapping, rows } = req.body;
      if (!mapping || !rows || !rows.length) {
        return res.status(400).json({ error: 'Datos de importación requeridos' });
      }

      const { name, price, category, description } = mapping;
      if (!name || !price || !category) {
        return res.status(400).json({ error: 'Nombre, precio y categoría son requeridos' });
      }

      let imported = 0;
      let skipped = 0;
      const errors = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const itemName = String(row[name] || '').trim();
        const rawPrice = String(row[price] || '').replace(/[^0-9.,-]/g, '').replace(',', '.');
        const itemPrice = parseFloat(rawPrice);
        const itemCategory = String(row[category] || '').trim();
        const itemDescription = description ? String(row[description] || '').trim() : '';

        if (!itemName || isNaN(itemPrice) || !itemCategory) {
          skipped++;
          continue;
        }

        try {
          await MenuItem.create(itemName, itemDescription, itemPrice, itemCategory, null);
          imported++;
        } catch (err) {
          errors.push({ row: i + 1, name: itemName, error: err.message });
        }
      }

      res.json({ imported, skipped, errors, total: rows.length });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MenuController();