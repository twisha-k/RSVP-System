const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot be more than 1000 characters'],
    minlength: [1, 'Comment cannot be empty']
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'harassment', 'other']
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isApproved: {
    type: Boolean,
    default: true
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
commentSchema.index({ eventId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ isDeleted: 1, isApproved: 1 });

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for reply count
commentSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Virtual for formatted timestamp
commentSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Ensure virtuals are included in JSON output
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

// Pre-save middleware to handle edits
commentSchema.pre('save', function(next) {
  if (this.isModified('comment') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

// Method to add a like
commentSchema.methods.addLike = function(userId) {
  const existingLike = this.likes.find(like => 
    like.user.toString() === userId.toString()
  );
  
  if (!existingLike) {
    this.likes.push({ user: userId });
  }
  
  return this.save();
};

// Method to remove a like
commentSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => 
    like.user.toString() !== userId.toString()
  );
  
  return this.save();
};

// Method to soft delete
commentSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.comment = '[This comment has been deleted]';
  return this.save();
};

// Method to add reply
commentSchema.methods.addReply = function(replyId) {
  if (!this.replies.includes(replyId)) {
    this.replies.push(replyId);
  }
  return this.save();
};

// Static method to get comments for an event with pagination
commentSchema.statics.getEventComments = async function(eventId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const comments = await this.find({
    eventId,
    parentComment: null,
    isDeleted: false,
    isApproved: true
  })
  .populate('userId', 'name profilePic')
  .populate({
    path: 'replies',
    match: { isDeleted: false, isApproved: true },
    populate: {
      path: 'userId',
      select: 'name profilePic'
    },
    options: { sort: { createdAt: 1 } }
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
  
  const total = await this.countDocuments({
    eventId,
    parentComment: null,
    isDeleted: false,
    isApproved: true
  });
  
  return {
    comments,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalComments: total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    }
  };
};

// Static method to report a comment
commentSchema.statics.reportComment = async function(commentId, userId, reason) {
  return this.findByIdAndUpdate(
    commentId,
    {
      $set: { isReported: true },
      $push: {
        reportedBy: {
          user: userId,
          reason,
          reportedAt: new Date()
        }
      }
    },
    { new: true }
  );
};

module.exports = mongoose.model('Comment', commentSchema);