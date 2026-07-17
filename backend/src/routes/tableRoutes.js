const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');

// POST /api/tables/generate - Generar mesas
router.post('/generate', tableController.generateTables);

// GET /api/tables - Obtener todas las mesas
router.get('/', tableController.getAllTables);

// GET /api/tables/:qrCode - Obtener mesa por código QR
router.get('/:qrCode', tableController.getTableByQR);

// GET /api/tables/:qrCode/qr-image - Generar imagen QR
router.get('/:qrCode/qr-image', tableController.generateQRImage);

module.exports = router;