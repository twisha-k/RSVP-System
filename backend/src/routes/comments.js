const express = require('express');
const router = express.Router();
const {
  createComment,
  getEventComments,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getUserComments
} = require('../controllers/commentController');
const { auth, optionalAuth } = require('../middleware/auth');

// Public routes (can view comments without auth)
router.get('/events/:eventId', optionalAuth, getEventComments);

// Protected routes
router.use(auth);

router.get('/my', getUserComments);
router.post('/events/:eventId', createComment);
router.put('/:commentId', updateComment);
router.delete('/:commentId', deleteComment);
router.post('/:commentId/like', toggleCommentLike);

module.exports = router;