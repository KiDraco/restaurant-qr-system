const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const sessionController = require('../controllers/sessionController');
const { verifyToken } = require('../middleware/auth');

// POST /api/orders - Crear orden (público - clientes)
router.post('/', orderController.createOrder);

// GET /api/orders/table/:tableNumber - Obtener órdenes (público - clientes)
router.get('/table/:tableNumber', orderController.getOrdersByTable);

// GET /api/bill/table/:tableNumber - Obtener cuenta (público - clientes)
router.get('/table/:tableNumber/bill', sessionController.getBill);

// Rutas protegidas (admin/staff)
router.get('/stats', verifyToken, orderController.getSalesStats);

module.exports = router;