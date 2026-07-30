const Promotion = require('../models/Promotion');

class PromotionController {
  async getActivePromotions(req, res, next) {
    try {
      const promotions = await Promotion.getActive();
      res.json(promotions);
    } catch (error) {
      next(error);
    }
  }

  async getAllPromotions(req, res, next) {
    try {
      const promotions = await Promotion.getAll();
      res.json(promotions);
    } catch (error) {
      next(error);
    }
  }

  async createPromotion(req, res, next) {
    try {
      const { name, description, discount_percentage, image_url, start_date, end_date } = req.body;

      if (!name || discount_percentage === undefined || discount_percentage === null) {
        return res.status(400).json({ error: 'Nombre y descuento son requeridos' });
      }

      const promotion = await Promotion.create(name, description, discount_percentage, image_url, start_date, end_date);

      res.json({
        message: 'Promocion creada',
        promotion
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePromotion(req, res, next) {
    try {
      const { id } = req.params;
      const success = await Promotion.update(id, req.body);

      if (!success) {
        return res.status(404).json({ error: 'Promocion no encontrada' });
      }

      res.json({ message: 'Promocion actualizada' });
    } catch (error) {
      next(error);
    }
  }

  async deletePromotion(req, res, next) {
    try {
      const { id } = req.params;
      const success = await Promotion.delete(id);

      if (!success) {
        return res.status(404).json({ error: 'Promocion no encontrada' });
      }

      res.json({ message: 'Promocion desactivada' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PromotionController();
