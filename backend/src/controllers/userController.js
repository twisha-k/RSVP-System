const User = require('../models/User');
const Event = require('../models/Event');
const RSVP = require('../models/RSVP');
const Comment = require('../models/Comment');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's event statistics
    const [eventsCreated, rsvpCount, commentCount] = await Promise.all([
      Event.countDocuments({ organizer: userId }),
      RSVP.countDocuments({ user: userId }),
      Comment.countDocuments({ author: userId })
    ]);

    const userProfile = {
      ...user.toObject(),
      stats: {
        eventsCreated,
        eventsAttended: rsvpCount,
        commentsPosted: commentCount
      }
    };

    res.status(200).json({
      success: true,
      user: userProfile
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, bio, location, interests, avatar } = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (interests !== undefined) user.interests = interests;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    // Return user without password
    const updatedUser = await User.findById(userId).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update email
const updateEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newEmail, password } = req.body;

    // Validate required fields
    if (!newEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'New email and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Check if email is already taken
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken'
      });
    }

    // Update email
    user.email = newEmail;
    await user.save();

    // Generate new token with updated email
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email updated successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete user account
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password, confirmDelete } = req.body;

    // Validate required fields
    if (!password || confirmDelete !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message: 'Password and confirmation (type "DELETE") are required'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Check if user has upcoming events as organizer
    const upcomingEvents = await Event.countDocuments({
      organizer: userId,
      startDate: { $gt: new Date() }
    });

    if (upcomingEvents > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete account. You have ${upcomingEvents} upcoming event(s) as organizer. Please cancel or transfer them first.`
      });
    }

    // Delete user's data
    await Promise.all([
      // Delete user's RSVPs
      RSVP.deleteMany({ user: userId }),
      // Delete user's comments
      Comment.deleteMany({ author: userId }),
      // Delete user's past events (keep them but remove organizer reference)
      Event.updateMany(
        { organizer: userId },
        { $unset: { organizer: 1 } }
      )
    ]);

    // Delete the user account
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's dashboard data
const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's upcoming events (as attendee)
    const upcomingRSVPs = await RSVP.find({
      user: userId,
      status: 'attending'
    })
    .populate({
      path: 'event',
      match: { startDate: { $gt: new Date() } },
      select: 'title startDate location'
    })
    .limit(5);

    const upcomingEvents = upcomingRSVPs
      .filter(rsvp => rsvp.event)
      .map(rsvp => rsvp.event);

    // Get user's created events
    const myEvents = await Event.find({
      organizer: userId
    })
    .select('title startDate location maxAttendees')
    .sort({ startDate: -1 })
    .limit(5);

    // Get recent activity counts
    const [totalEventsCreated, totalRSVPs, totalComments, recentRSVPs] = await Promise.all([
      Event.countDocuments({ organizer: userId }),
      RSVP.countDocuments({ user: userId }),
      Comment.countDocuments({ author: userId }),
      RSVP.find({ user: userId })
        .populate('event', 'title startDate')
        .sort({ responseDate: -1 })
        .limit(5)
    ]);

    res.status(200).json({
      success: true,
      dashboard: {
        upcomingEvents,
        myEvents,
        recentRSVPs,
        stats: {
          totalEventsCreated,
          totalRSVPs,
          totalComments
        }
      }
    });

  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Search users by name
    const searchRegex = new RegExp(query.trim(), 'i');
    const users = await User.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { $expr: { $regexMatch: { input: { $concat: ['$firstName', ' ', '$lastName'] }, regex: searchRegex } } }
      ]
    })
    .select('firstName lastName avatar bio location')
    .skip(skip)
    .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { $expr: { $regexMatch: { input: { $concat: ['$firstName', ' ', '$lastName'] }, regex: searchRegex } } }
      ]
    });

    res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasNext: skip + users.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  updateEmail,
  deleteAccount,
  getUserDashboard,
  searchUsers
};