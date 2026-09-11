const Theme = require('../models/Theme');

class ThemeController {
  async listAll(req, res, next) {
    try {
      const themes = await Theme.findAll();
      res.json(themes);
    } catch (error) {
      next(error);
    }
  }

  async getActive(req, res, next) {
    try {
      const theme = await Theme.findActive();
      if (!theme) {
        // Fallback al default (puede que no haya ninguno activado todavía)
        const defaultTheme = await Theme.getConfig(0) || { colors: { primary: '#FF6B6B', secondary: '#PP-6B6B', background: '#FFFFFF', text: '#2A2A2A' }, font_family: 'system' };
        return res.json(defaultTheme);
      }
      res.json(Theme.getConfig(theme.id));
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { name, config } = req.body;
      const theme = await Theme.create(name, config, false);
      res.status(201).json({
        message: 'Theme creado',
        theme
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, config } = req.body;
      const success = await Theme.update(id, name, config);
      if (!success) {
        return res.status(404).json({ error: 'Theme no encontrado' });
      }
      res.json({ message: 'Theme actualizado', theme: await Theme.findById(id) });
    } catch (error) {
      next(error);
    }
  }

  async activate(req, res, next) {
    try {
      const { id } = req.params;
      const activated = await Theme.activate(id);
      if (!activated) {
        return res.status(404).json({ error: 'Theme no encontrado' });
      }
      res.json({ message: 'Theme activado', theme: await Theme.findById(id) });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const success = await Theme.delete(id);
      if (!success) {
        return res.status(404).json({ error: 'Theme no encontrado' });
      }
      res.json({ message: 'Theme eliminado' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ThemeController();