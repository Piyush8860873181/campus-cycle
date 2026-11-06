const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getIsConnected } = require('../config/db');
const storage = require('../utils/storageAdapter');

const JWT_SECRET = process.env.JWT_SECRET || 'campuscycle_jwt_super_secret_key_2026';

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    let user = null;
    if (getIsConnected()) {
      user = await User.findById(decoded.id).select('-password');
    } else {
      user = storage.findById('users', decoded.id);
      if (user) {
        const { password, ...safeUser } = user;
        user = safeUser;
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by campus administration.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
  }
};

const optionalAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    let user = null;
    if (getIsConnected()) {
      user = await User.findById(decoded.id).select('-password');
    } else {
      user = storage.findById('users', decoded.id);
      if (user) {
        const { password, ...safeUser } = user;
        user = safeUser;
      }
    }
    req.user = user;
  } catch (err) {
    req.user = null;
  }
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied: Administrator privileges required.' });
  }
};

module.exports = { protect, optionalAuth, adminOnly, JWT_SECRET };
