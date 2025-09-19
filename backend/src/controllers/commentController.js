const Comment = require('../models/Comment');
const Event = require('../models/Event');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');

// Create a new comment
const createComment = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { content, parentComment } = req.body;
    const userId = req.user.id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // If this is a reply, check if parent comment exists
    if (parentComment) {
      const parentCommentDoc = await Comment.findById(parentComment);
      if (!parentCommentDoc) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }

      // Ensure parent comment belongs to the same event
      if (parentCommentDoc.event.toString() !== eventId) {
        return res.status(400).json({
          success: false,
          message: 'Parent comment does not belong to this event'
        });
      }
    }

    // Create the comment
    const comment = new Comment({
      content,
      author: userId,
      event: eventId,
      parentComment: parentComment || null
    });

    await comment.save();
    await comment.populate('author', 'firstName lastName avatar');

    // Send notification to event organizer (if not the commenter)
    if (event.organizer.toString() !== userId) {
      const organizer = await User.findById(event.organizer);
      const commenter = await User.findById(userId);
      
      if (organizer && commenter) {
        try {
          await sendEmail(
            organizer.email,
            'New Comment on Your Event',
            `${commenter.firstName} ${commenter.lastName} commented on your event "${event.title}": "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`
          );
        } catch (emailError) {
          console.error('Failed to send comment notification:', emailError);
        }
      }
    }

    // If this is a reply, notify the parent comment author
    if (parentComment) {
      const parentCommentDoc = await Comment.findById(parentComment).populate('author');
      if (parentCommentDoc && parentCommentDoc.author._id.toString() !== userId) {
        const commenter = await User.findById(userId);
        
        try {
          await sendEmail(
            parentCommentDoc.author.email,
            'Reply to Your Comment',
            `${commenter.firstName} ${commenter.lastName} replied to your comment on "${event.title}": "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`
          );
        } catch (emailError) {
          console.error('Failed to send reply notification:', emailError);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      comment
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get comments for an event
const getEventComments = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get top-level comments (not replies)
    const comments = await Comment.find({
      event: eventId,
      parentComment: null
    })
    .populate('author', 'firstName lastName avatar')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'firstName lastName avatar'
      },
      options: { sort: { createdAt: 1 } }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Comment.countDocuments({
      event: eventId,
      parentComment: null
    });

    res.status(200).json({
      success: true,
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalComments: total,
        hasNext: skip + comments.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get event comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update a comment
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author
    if (comment.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }

    // Update the comment
    comment.content = content;
    comment.isEdited = true;
    await comment.save();

    await comment.populate('author', 'firstName lastName avatar');

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      comment
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete a comment
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author or event organizer
    const event = await Event.findById(comment.event);
    const isAuthor = comment.author.toString() === userId;
    const isOrganizer = event.organizer.toString() === userId;

    if (!isAuthor && !isOrganizer) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments or comments on your events'
      });
    }

    // Delete all replies to this comment first
    if (comment.parentComment === null) {
      await Comment.deleteMany({ parentComment: commentId });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Like/Unlike a comment
const toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user has already liked the comment
    const hasLiked = comment.likes.includes(userId);

    if (hasLiked) {
      // Unlike the comment
      comment.likes = comment.likes.filter(like => like.toString() !== userId);
    } else {
      // Like the comment
      comment.likes.push(userId);
    }

    await comment.save();

    // Populate for response
    await comment.populate('author', 'firstName lastName avatar');

    res.status(200).json({
      success: true,
      message: hasLiked ? 'Comment unliked' : 'Comment liked',
      comment: {
        ...comment.toObject(),
        likesCount: comment.likes.length,
        hasLiked: !hasLiked
      }
    });

  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's comments
const getUserComments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get user's comments with event details
    const comments = await Comment.find({ author: userId })
      .populate('event', 'title startDate')
      .populate('author', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Comment.countDocuments({ author: userId });

    res.status(200).json({
      success: true,
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalComments: total,
        hasNext: skip + comments.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get user comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user comments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createComment,
  getEventComments,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getUserComments
};