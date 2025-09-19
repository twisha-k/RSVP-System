const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  adminLogin,
  adminLogout
} = require('../controllers/authController');
const { auth, adminAuth } = require('../middleware/auth');

// User authentication routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);
router.get('/me', auth, getMe);

// Admin authentication routes
router.post('/admin/login', adminLogin);
router.post('/admin/logout', adminAuth, adminLogout);

module.exports = router;