const Theme = require('../models/Theme');

class ThemeController {
  async listAll(req, res, next) {
    try {
      const themes = await Theme.findAll();
      // Parse canvas_json and background_config for frontend
      const themesWithParsed = themes.map(theme => ({
        ...theme,
        canvas_json: theme.canvas_json ? JSON.parse(theme.canvas_json) : null,
        background_config: theme.background_config ? JSON.parse(theme.background_config) : null,
      }));
      res.json(themesWithParsed);
    } catch (error) {
      next(error);
    }
  }

  async getActive(req, res, next) {
    try {
      const theme = await Theme.findActive();
      if (!theme) {
        // Fallback al default (puede que no haya ninguno activado todavía)
        const defaultTheme = { colors: { primary: '#FF6B6B', secondary: '#4ECDC4', background: '#FFFFFF', text: '#2A2A2A' }, font_family: 'system' };
        return res.json({ config: defaultTheme });
      }
      // Use Theme.getConfig which merges canvas and legacy config
      const config = await Theme.getConfig(theme.id);
      res.json({ config });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const theme = await Theme.findById(id);
      if (!theme) {
        return res.status(404).json({ error: 'Theme no encontrado' });
      }
      res.json({
        ...theme,
        canvas_json: theme.canvas_json ? JSON.parse(theme.canvas_json) : null,
        background_config: theme.background_config ? JSON.parse(theme.background_config) : null,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { name, config, canvas_json, page_format, background_config } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Nombre del theme es requerido' });
      }
      const theme = await Theme.create(name, config || {}, false, canvas_json, page_format, background_config);
      res.status(201).json({
        message: 'Theme creado',
        theme: {
          ...theme,
          canvas_json: theme.canvas_json ? JSON.parse(theme.canvas_json) : null,
          background_config: theme.background_config ? JSON.parse(theme.background_config) : null,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, config, canvas_json, page_format, background_config } = req.body;
      const success = await Theme.update(id, name, config, canvas_json, page_format, background_config);
      if (!success) {
        return res.status(404).json({ error: 'Theme no encontrado' });
      }
      const theme = await Theme.findById(id);
      res.json({ 
        message: 'Theme actualizado', 
        theme: {
          ...theme,
          canvas_json: theme.canvas_json ? JSON.parse(theme.canvas_json) : null,
          background_config: theme.background_config ? JSON.parse(theme.background_config) : null,
        }
      });
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
      const theme = await Theme.findById(id);
      res.json({ 
        message: 'Theme activado', 
        theme: {
          ...theme,
          canvas_json: theme.canvas_json ? JSON.parse(theme.canvas_json) : null,
          background_config: theme.background_config ? JSON.parse(theme.background_config) : null,
        }
      });
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