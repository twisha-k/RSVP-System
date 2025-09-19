const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  updateEmail,
  deleteAccount,
  getUserDashboard,
  searchUsers
} = require('../controllers/userController');
const { auth } = require('../middleware/auth');

// All user routes require authentication
router.use(auth);

// User profile routes
router.get('/me', getUserProfile);
router.get('/dashboard', getUserDashboard);
router.put('/profile', updateUserProfile);
router.put('/password', changePassword);
router.put('/email', updateEmail);
router.delete('/account', deleteAccount);

// User search and public profiles
router.get('/search', searchUsers);
router.get('/:id', getUserProfile);

module.exports = router;