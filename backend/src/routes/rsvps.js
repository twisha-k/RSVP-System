const express = require('express');
const router = express.Router();
const {
  createRSVP,
  getUserRSVPs,
  getEventRSVPs,
  deleteRSVP,
  getUserEventRSVP
} = require('../controllers/rsvpController');
const { auth } = require('../middleware/auth');

// All RSVP routes require authentication
router.use(auth);

// User RSVP routes
router.get('/my', getUserRSVPs);
router.post('/events/:eventId', createRSVP);
router.get('/events/:eventId', getUserEventRSVP);
router.delete('/events/:eventId', deleteRSVP);

// Event organizer routes
router.get('/events/:eventId/all', getEventRSVPs);

module.exports = router;