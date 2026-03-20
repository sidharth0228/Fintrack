const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const stocksController = require('../controllers/stocksController');

router.post('/sync', authMiddleware, stocksController.syncPortfolio);
router.get('/', authMiddleware, stocksController.getPortfolio);
router.get('/ai-report', authMiddleware, stocksController.getAIReport);

// Manual Asset Endpoints
router.post('/manual-stock', authMiddleware, stocksController.addManualStock);
router.post('/mutual-fund', authMiddleware, stocksController.addMutualFund);
router.post('/property', authMiddleware, stocksController.addProperty);

module.exports = router;
