const express = require('express');
const router = express.Router();
const { registerUser, authUser, getMe, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', (req, res, next) => {
	req.registrationRole = 'RIDER';
	next();
}, registerUser);
router.post('/login', authUser);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
