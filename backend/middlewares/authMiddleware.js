const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'voltroutesecretkey123';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user || req.user.isActive === false) {
        return res.status(401).json({ message: 'Account is inactive or no longer exists' });
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

const provider = (req, res, next) => {
  if (req.user && (req.user.role === 'PROVIDER' || req.user.role === 'ADMIN')) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a provider' });
  }
};

const rider = (req, res, next) => {
  if (req.user && req.user.role === 'RIDER') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a rider' });
  }
};

module.exports = { protect, admin, provider, rider };
