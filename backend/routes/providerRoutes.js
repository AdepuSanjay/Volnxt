const express = require('express');
const router = express.Router();
const { getNearbyProviders, getProviderById, updateProfile } = require('../controllers/providerController');
const { registerUser } = require('../controllers/authController');
const { protect, provider } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/register', (req, res, next) => {
  req.registrationRole = 'PROVIDER';
  next();
}, registerUser);
router.get('/nearby', getNearbyProviders);
router.get('/:id', getProviderById);
router.put('/profile', protect, provider, updateProfile);

// Route for uploading a profile photo or verification document
router.post('/upload', protect, provider, upload.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({ url: req.file.path, message: 'Media uploaded successfully' });
});

module.exports = router;
