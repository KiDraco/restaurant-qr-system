const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public
router.get('/active', promotionController.getActivePromotions);

// Protected (admin)
router.get('/', verifyToken, requireRole('admin'), promotionController.getAllPromotions);
router.post('/', verifyToken, requireRole('admin'), promotionController.createPromotion);
router.put('/:id', verifyToken, requireRole('admin'), promotionController.updatePromotion);
router.delete('/:id', verifyToken, requireRole('admin'), promotionController.deletePromotion);

module.exports = router;
