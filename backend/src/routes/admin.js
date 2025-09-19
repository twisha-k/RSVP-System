const express = require('express');
const router = express.Router();
const {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  getAllEvents,
  deleteUser,
  deleteEvent,
  toggleUserStatus,
  getRecentActivity
} = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');

// Admin login page (EJS template)
router.get('/login', (req, res) => {
  res.render('admin/login', { 
    title: 'Admin Login',
    error: null 
  });
});

// Admin dashboard page (EJS template)
router.get('/dashboard', adminAuth, (req, res) => {
  res.render('admin/dashboard', { 
    title: 'Admin Dashboard',
    admin: req.admin
  });
});

// API Routes for admin functionality
// Admin login API
router.post('/api/login', adminLogin);

// All other API routes require admin authentication
router.use('/api', adminAuth);

// Dashboard API routes
router.get('/api/dashboard/stats', getDashboardStats);
router.get('/api/dashboard/activity', getRecentActivity);

// User management API routes
router.get('/api/users', getAllUsers);
router.delete('/api/users/:userId', deleteUser);
router.patch('/api/users/:userId/status', toggleUserStatus);

// Event management API routes
router.get('/api/events', getAllEvents);
router.delete('/api/events/:eventId', deleteEvent);

module.exports = router;