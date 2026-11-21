const express = require('express');
const router = express.Router();
const { startSession, updateBattery, endSession, getSession, getActiveSession, getProviderStats } = require('../controllers/chargingController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/active', protect, getActiveSession);
router.get('/provider/stats', protect, getProviderStats);
router.post('/start', protect, startSession);
router.put('/:id/update-battery', protect, updateBattery);
router.put('/:id/end', protect, endSession);
router.get('/:id', protect, getSession);

module.exports = router;
