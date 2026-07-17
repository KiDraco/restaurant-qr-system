const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/menu - Obtener todos los productos (público)
router.get('/', menuController.getAllMenuItems);

// GET /api/menu/:id - Obtener producto por ID (público)
router.get('/:id', menuController.getMenuItemById);

// Rutas protegidas (admin/staff pueden ver, solo admin puede modificar)
router.post('/', verifyToken, requireRole('admin'), menuController.createMenuItem);
router.put('/:id', verifyToken, requireRole('admin'), menuController.updateMenuItem);
router.delete('/:id', verifyToken, requireRole('admin'), menuController.deleteMenuItem);

module.exports = router;