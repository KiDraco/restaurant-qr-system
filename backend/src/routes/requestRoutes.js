const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { verifyToken } = require('../middleware/auth');

// POST /api/requests - Crear solicitud (público - clientes)
router.post('/', requestController.createRequest);

// Rutas protegidas (admin/staff)
router.get('/pending', verifyToken, requestController.getPendingRequests);
router.patch('/:id/attend', verifyToken, requestController.attendRequest);
router.get('/stats', verifyToken, requestController.getStats);

module.exports = router;