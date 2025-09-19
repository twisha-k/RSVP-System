const Event = require('../models/Event');
const RSVP = require('../models/RSVP');
const Comment = require('../models/Comment');
const { sendEventNotificationEmail } = require('../utils/email');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      location,
      date,
      search,
      sortBy = 'date',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {
      status: 'published',
      isApproved: true,
      date: { $gte: new Date() } // Only future events
    };

    // Add filters
    if (category) {
      query.category = category;
    }

    // Handle search and location filters separately
    if (location) {
      query.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.country': { $regex: location, $options: 'i' } },
        { 'location.address': { $regex: location, $options: 'i' } }
      ];
    }

    if (search) {
      console.log('Search term received:', search, 'Length:', search.length);
      
      // Escape special regex characters to prevent regex injection
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i'); // Case-insensitive regex
      
      console.log('Escaped search term:', escapedSearch);
      console.log('Search regex:', searchRegex);
      
      // If location filter already exists, we need to combine with $and
      if (query.$or) {
        // Combine location and search filters
        const locationOr = query.$or;
        delete query.$or;
        
        query.$and = [
          { $or: locationOr },
          { 
            $or: [
              { title: { $regex: searchRegex } },
              { description: { $regex: searchRegex } },
              { 'location.city': { $regex: searchRegex } },
              { 'location.country': { $regex: searchRegex } },
              { 'location.address': { $regex: searchRegex } },
              { 'location.venue': { $regex: searchRegex } },
              { category: { $regex: searchRegex } }
            ]
          }
        ];
      } else {
        // Only search filter
        query.$or = [
          { title: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { 'location.city': { $regex: searchRegex } },
          { 'location.country': { $regex: searchRegex } },
          { 'location.address': { $regex: searchRegex } },
          { 'location.venue': { $regex: searchRegex } },
          { category: { $regex: searchRegex } }
        ];
      }
      
      console.log('Final query with search:', JSON.stringify(query, null, 2));
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const events = await Event.find(query)
      .populate('createdBy', 'name profilePic')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      events,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalEvents: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching events'
    });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name profilePic email')
      .populate('attendees.user', 'name profilePic');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event is published and approved (unless user is owner or admin)
    if (
      event.status !== 'published' || 
      !event.isApproved
    ) {
      if (
        !req.user || 
        (req.user._id.toString() !== event.createdBy._id.toString() && req.user.role !== 'admin')
      ) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
    }

    // Get user's RSVP status if authenticated
    let userRSVP = null;
    if (req.user) {
      userRSVP = await RSVP.findOne({
        userId: req.user._id,
        eventId: event._id
      });
    }

    res.status(200).json({
      success: true,
      event,
      userRSVP: userRSVP ? userRSVP.status : null
    });

  } catch (error) {
    console.error('Get event error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching event'
    });
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      date,
      time,
      category,
      capacity,
      price = 0,
      currency = 'USD',
      image,
      tags = [],
      requirements,
      contactInfo
    } = req.body;

    // Validation
    if (!title || !description || !location || !date || !time || !category || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate date is in the future
    const eventDate = new Date(date);
    if (eventDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Event date must be in the future'
      });
    }

    // Create event
    const event = await Event.create({
      title,
      description,
      location,
      date: eventDate,
      time,
      category,
      capacity,
      price,
      currency,
      image,
      tags,
      requirements,
      contactInfo,
      createdBy: req.user._id
    });

    await event.populate('createdBy', 'name profilePic email');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating event'
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Owner or Admin)
const updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }

    // Validate date if being updated
    if (req.body.date) {
      const eventDate = new Date(req.body.date);
      if (eventDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Event date must be in the future'
        });
      }
    }

    // Update event
    event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'name profilePic email');

    // Notify attendees of update (don't wait for it)
    if (event.attendees.length > 0) {
      const attendeeEmails = await Event.findById(event._id)
        .populate('attendees.user', 'email name');
      
      attendeeEmails.attendees.forEach(attendee => {
        if (attendee.status === 'joined') {
          sendEventNotificationEmail(
            attendee.user.email,
            attendee.user.name,
            event,
            'event_update'
          ).catch(err => console.error('Failed to send update notification:', err));
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event
    });

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating event'
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Owner or Admin)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    }

    // Delete related RSVPs and comments
    await RSVP.deleteMany({ eventId: event._id });
    await Comment.deleteMany({ eventId: event._id });

    // Delete event
    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting event'
    });
  }
};

// @desc    Get events created by user
// @route   GET /api/events/my/created
// @access  Private
const getMyEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { createdBy: req.user._id };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      events,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalEvents: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your events'
    });
  }
};

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
};