const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { loginSchema, registerSchema } = require('../validators/schemas');

// POST /api/auth/login - Iniciar sesión
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/register - Registrar usuario (requiere x-admin-secret)
router.post('/register', validate(registerSchema), authController.register);

// GET /api/auth/me - Obtener perfil del usuario autenticado
router.get('/me', verifyToken, authController.me);

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
