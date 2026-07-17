const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { verifyToken } = require('../middleware/auth');

// POST /api/sessions/start - Iniciar sesión (público - clientes)
router.post('/start', sessionController.startSession);

// GET /api/sessions/table/:tableNumber - Obtener sesión activa (público - clientes)
router.get('/table/:tableNumber', sessionController.getActiveSession);

// Rutas protegidas (admin/staff)
router.post('/:sessionId/close', verifyToken, sessionController.closeSession);
router.get('/active', verifyToken, sessionController.getAllActiveSessions);

module.exports = router;