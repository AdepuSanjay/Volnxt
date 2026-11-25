const express = require('express');
const router = express.Router();
const { startSession, updateBattery, endSession, getSession, getActiveSession, getProviderStats } = require('../controllers/chargingController');
const { protect, provider } = require('../middlewares/authMiddleware');

router.get('/active', protect, getActiveSession);
router.get('/provider/stats', protect, provider, getProviderStats);
router.post('/start', protect, provider, startSession);
router.put('/:id/update-battery', protect, provider, updateBattery);
router.put('/:id/end', protect, provider, endSession);
router.get('/:id', protect, getSession);

module.exports = router;
