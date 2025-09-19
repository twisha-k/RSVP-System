const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents
} = require('../controllers/eventController');
const { auth, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/', optionalAuth, getEvents);
router.get('/my/created', auth, getMyEvents);
router.get('/:id', optionalAuth, getEvent);

// Protected routes
router.post('/', auth, createEvent);
router.put('/:id', auth, updateEvent);
router.delete('/:id', auth, deleteEvent);

module.exports = router;