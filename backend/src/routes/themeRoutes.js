const express = require('express');
const router = express.Router();
const themeController = require('../controllers/themeController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { themeCreateSchema, themeUpdateSchema } = require('../validators/themeSchemas');

// GET /api/themes - Listar todos los themes (admin)
router.get('/', verifyToken, requireRole('admin'), themeController.listAll);

// GET /api/themes/active - Obtener theme activo (público, sin auth)
router.get('/active', themeController.getActive);

// POST /api/themes - Crear theme (admin)
router.post('/', verifyToken, requireRole('admin'), validate(themeCreateSchema), themeController.create);

// PUT /api/themes/:id - Actualizar theme (admin)
router.put('/:id', verifyToken, requireRole('admin'), validate(themeUpdateSchema), themeController.update);

// POST /api/themes/:id/activar - Activar theme (admin)
router.post('/:id/activate', verifyToken, requireRole('admin'), themeController.activate);

// DELETE /api/themes/:id - Eliminar theme (admin)
router.delete('/:id', verifyToken, requireRole('admin'), themeController.delete);

function validate(schema) {
  return async (req, res, next) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (err) {
      res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    }
  };
}

module.exports = router;