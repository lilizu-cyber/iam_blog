const jwt = require('jsonwebtoken');
const { getJWTSecret } = require('../utils/jwtSecret');
const errorTracker = require('../utils/errorTracker');

// Authentication middleware for admin routes
const authenticateAdmin = (req, res, next) => {
  try {
    const token = req.cookies.adminToken;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }
    
    // Get validated JWT secret and verify token
    const JWT_SECRET = getJWTSecret();
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
        code: 'INSUFFICIENT_PRIVILEGES'
      });
    }
    
    // Add user info to request
    req.user = {
      id: decoded.username,
      username: decoded.username,
      role: decoded.role,
      loginTime: decoded.loginTime
    };
    
    // Set user context in error tracker
    errorTracker.setUser(req.user);
    
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = {
  authenticateAdmin
};




