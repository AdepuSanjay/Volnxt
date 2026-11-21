const express = require('express');
const router = express.Router();
const { createRequest, getMyRequests, getProviderRequests, acceptRequest, rejectRequest, updateRequestStatus } = require('../controllers/requestController');
const { protect, provider } = require('../middlewares/authMiddleware');

router.post('/', protect, createRequest);
router.get('/my', protect, getMyRequests);
router.get('/provider', protect, provider, getProviderRequests);
router.put('/:id/accept', protect, provider, acceptRequest);
router.put('/:id/reject', protect, provider, rejectRequest);

router.put('/:id/status', protect, updateRequestStatus);

module.exports = router;
