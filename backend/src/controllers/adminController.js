const Admin = require('../models/Admin');
const User = require('../models/User');
const Event = require('../models/Event');
const RSVP = require('../models/RSVP');
const Comment = require('../models/Comment');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateToken(admin._id, 'admin');

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get admin dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    // Get basic counts
    const [totalUsers, totalEvents, totalRSVPs, totalComments] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      RSVP.countDocuments(),
      Comment.countDocuments()
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentUsers, recentEvents, recentRSVPs] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Event.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      RSVP.countDocuments({ responseDate: { $gte: thirtyDaysAgo } })
    ]);

    // Get upcoming events
    const upcomingEvents = await Event.find({
      startDate: { $gt: new Date() }
    })
    .populate('organizer', 'firstName lastName email')
    .sort({ startDate: 1 })
    .limit(5);

    // Get top event organizers
    const topOrganizers = await Event.aggregate([
      { $group: { _id: '$organizer', eventCount: { $sum: 1 } } },
      { $sort: { eventCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { eventCount: 1, 'user.firstName': 1, 'user.lastName': 1, 'user.email': 1 } }
    ]);

    // Get RSVP status distribution
    const rsvpStats = await RSVP.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const rsvpDistribution = {
      attending: 0,
      maybe: 0,
      not_attending: 0
    };

    rsvpStats.forEach(stat => {
      rsvpDistribution[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      stats: {
        overview: {
          totalUsers,
          totalEvents,
          totalRSVPs,
          totalComments
        },
        recent: {
          newUsers: recentUsers,
          newEvents: recentEvents,
          newRSVPs: recentRSVPs
        },
        upcomingEvents,
        topOrganizers,
        rsvpDistribution
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all users with pagination
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;

    // Build filter
    let filter = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ];
    }
    if (status) {
      filter.isActive = status === 'active';
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await User.countDocuments(filter);

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
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all events with pagination
const getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;

    // Build filter
    let filter = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'location.venue': searchRegex }
      ];
    }
    if (status === 'upcoming') {
      filter.startDate = { $gt: new Date() };
    } else if (status === 'past') {
      filter.startDate = { $lt: new Date() };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get events
    const events = await Event.find(filter)
      .populate('organizer', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Event.countDocuments(filter);

    res.status(200).json({
      success: true,
      events,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalEvents: total,
        hasNext: skip + events.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
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
        message: `Cannot delete user. They have ${upcomingEvents} upcoming event(s) as organizer.`
      });
    }

    // Delete user's data
    await Promise.all([
      RSVP.deleteMany({ user: userId }),
      Comment.deleteMany({ author: userId }),
      Event.updateMany(
        { organizer: userId },
        { $unset: { organizer: 1 } }
      )
    ]);

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete event (admin only)
const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Delete related data
    await Promise.all([
      RSVP.deleteMany({ event: eventId }),
      Comment.deleteMany({ event: eventId })
    ]);

    // Delete the event
    await Event.findByIdAndDelete(eventId);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Toggle user active status
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Toggle active status
    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get recent activity
const getRecentActivity = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // Get recent users
    const recentUsers = await User.find()
      .select('firstName lastName email createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 2);

    // Get recent events
    const recentEvents = await Event.find()
      .populate('organizer', 'firstName lastName')
      .select('title organizer createdAt startDate')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 2);

    // Combine and sort by date
    const activities = [
      ...recentUsers.map(user => ({
        type: 'user_joined',
        data: user,
        timestamp: user.createdAt
      })),
      ...recentEvents.map(event => ({
        type: 'event_created',
        data: event,
        timestamp: event.createdAt
      }))
    ];

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      activities: activities.slice(0, parseInt(limit))
    });

  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  adminLogin,
  getDashboardStats,
  getAllUsers,
  getAllEvents,
  deleteUser,
  deleteEvent,
  toggleUserStatus,
  getRecentActivity
};