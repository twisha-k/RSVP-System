const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Middleware to protect routes and authenticate users
const auth = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    try {
      // Verify token
      const decoded = verifyToken(token);
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-passwordHash');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid. User not found.'
        });
      }
      
      // Check if user is blocked
      if (user.status === 'blocked') {
        return res.status(403).json({
          success: false,
          message: 'Account has been blocked. Please contact support.'
        });
      }
      
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Middleware to check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header or session
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.session && req.session.adminToken) {
      token = req.session.adminToken;
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin authentication required.'
      });
    }
    
    try {
      // Verify token
      const decoded = verifyToken(token);
      
      // Get admin from database
      const admin = await Admin.findById(decoded.id).select('-passwordHash');
      
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid. Admin not found.'
        });
      }
      
      // Check if admin is active
      if (admin.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Admin account is not active.'
        });
      }
      
      req.admin = admin;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid.'
      });
    }
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in admin authentication'
    });
  }
};

// Middleware to check admin permissions
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required.'
      });
    }
    
    if (!req.admin.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${permission} permission required.`
      });
    }
    
    next();
  };
};

// Middleware to check if user owns the resource
const checkResourceOwner = (resourceIdParam = 'id', userIdField = 'createdBy') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    // Admin can access all resources
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Get resource ID from params
    const resourceId = req.params[resourceIdParam];
    
    // This middleware should be used after fetching the resource
    // The resource should be available in req.resource
    if (req.resource && req.resource[userIdField].toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }
    
    next();
  };
};

// Middleware for optional authentication (user can be null)
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // If no token, continue without user
    if (!token) {
      req.user = null;
      return next();
    }
    
    try {
      // Verify token
      const decoded = verifyToken(token);
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-passwordHash');
      
      if (user && user.status !== 'blocked') {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (error) {
      req.user = null;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

module.exports = {
  auth,
  adminAuth,
  checkPermission,
  checkResourceOwner,
  optionalAuth,
};