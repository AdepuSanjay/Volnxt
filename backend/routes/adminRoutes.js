const express = require('express');
const { getSummary, listModule, updateRecord } = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect, admin);
router.get('/summary', getSummary);
router.get('/:module', listModule);
router.patch('/:module/:id', updateRecord);

module.exports = router;