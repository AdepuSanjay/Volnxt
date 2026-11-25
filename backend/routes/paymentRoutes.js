const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { protect, rider } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/order', protect, rider, createOrder);
router.post('/verify', protect, rider, verifyPayment);

module.exports = router;