class Validator {
  static validateTableNumber(req, res, next) {
    const { tableNumber } = req.body;
    
    if (!tableNumber || isNaN(tableNumber) || tableNumber < 1) {
      return res.status(400).json({ error: 'Número de mesa inválido' });
    }
    
    next();
  }

  static validateMenuItem(req, res, next) {
    const { name, price, category } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Nombre de producto inválido' });
    }
    
    if (!price || isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'Precio inválido' });
    }
    
    if (!category || typeof category !== 'string' || category.trim() === '') {
      return res.status(400).json({ error: 'Categoría inválida' });
    }
    
    next();
  }

  static validateOrder(req, res, next) {
    const { tableNumber, menuItemId, quantity } = req.body;
    
    if (!tableNumber || isNaN(tableNumber) || tableNumber < 1) {
      return res.status(400).json({ error: 'Número de mesa inválido' });
    }
    
    if (!menuItemId || isNaN(menuItemId) || menuItemId < 1) {
      return res.status(400).json({ error: 'ID de producto inválido' });
    }
    
    if (!quantity || isNaN(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'Cantidad inválida' });
    }
    
    next();
  }
}

module.exports = Validator;