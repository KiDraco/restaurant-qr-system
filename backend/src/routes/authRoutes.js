const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// POST /api/auth/login - Iniciar sesión
router.post('/login', authController.login);

// POST /api/auth/register - Registrar usuario (requiere x-admin-secret)
router.post('/register', authController.register);

// GET /api/auth/me - Obtener perfil del usuario autenticado
router.get('/me', verifyToken, authController.me);

module.exports = router;
