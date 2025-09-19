const RSVP = require('../models/RSVP');
const Event = require('../models/Event');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');

// RSVP to an event
const createRSVP = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is trying to RSVP to their own event
    if (event.organizer.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Event organizers cannot RSVP to their own events'
      });
    }

    // Check if event registration is still open
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    // Check if event is at capacity for 'attending' responses
    if (status === 'attending') {
      const attendingCount = await RSVP.countDocuments({
        event: eventId,
        status: 'attending'
      });

      if (event.maxAttendees && attendingCount >= event.maxAttendees) {
        return res.status(400).json({
          success: false,
          message: 'Event has reached maximum capacity'
        });
      }
    }

    // Check if user has already RSVPed
    const existingRSVP = await RSVP.findOne({
      user: userId,
      event: eventId
    });

    if (existingRSVP) {
      // Update existing RSVP
      existingRSVP.status = status;
      if (notes) existingRSVP.notes = notes;
      existingRSVP.responseDate = Date.now();
      await existingRSVP.save();

      await existingRSVP.populate('user', 'firstName lastName email');
      await existingRSVP.populate('event', 'title startDate');

      // Send notification to organizer about RSVP update
      const organizer = await User.findById(event.organizer);
      if (organizer) {
        try {
          await sendEmail(
            organizer.email,
            'RSVP Updated',
            `${existingRSVP.user.firstName} ${existingRSVP.user.lastName} has updated their RSVP to "${status}" for your event "${event.title}".`
          );
        } catch (emailError) {
          console.error('Failed to send RSVP notification:', emailError);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'RSVP updated successfully',
        rsvp: existingRSVP
      });
    }

    // Create new RSVP
    const rsvp = new RSVP({
      user: userId,
      event: eventId,
      status,
      notes
    });

    await rsvp.save();
    await rsvp.populate('user', 'firstName lastName email');
    await rsvp.populate('event', 'title startDate');

    // Send notification to organizer about new RSVP
    const organizer = await User.findById(event.organizer);
    if (organizer) {
      try {
        await sendEmail(
          organizer.email,
          'New RSVP Received',
          `${rsvp.user.firstName} ${rsvp.user.lastName} has RSVPed "${status}" to your event "${event.title}".`
        );
      } catch (emailError) {
        console.error('Failed to send RSVP notification:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'RSVP created successfully',
      rsvp
    });

  } catch (error) {
    console.error('Create RSVP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create RSVP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's RSVPs
const getUserRSVPs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = { user: userId };
    if (status && ['attending', 'maybe', 'not_attending'].includes(status)) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get RSVPs with event details
    const rsvps = await RSVP.find(filter)
      .populate('event', 'title description startDate endDate location maxAttendees organizer')
      .populate('event.organizer', 'firstName lastName')
      .sort({ responseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await RSVP.countDocuments(filter);

    res.status(200).json({
      success: true,
      rsvps,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRSVPs: total,
        hasNext: skip + rsvps.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get user RSVPs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get RSVPs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get event's RSVPs (for organizers)
const getEventRSVPs = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    const { status, page = 1, limit = 50 } = req.query;

    // Check if event exists and user is the organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only event organizers can view RSVPs'
      });
    }

    // Build filter
    const filter = { event: eventId };
    if (status && ['attending', 'maybe', 'not_attending'].includes(status)) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get RSVPs with user details
    const rsvps = await RSVP.find(filter)
      .populate('user', 'firstName lastName email avatar')
      .sort({ responseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await RSVP.countDocuments(filter);

    // Get RSVP counts by status
    const statusCounts = await RSVP.aggregate([
      { $match: { event: event._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const counts = {
      attending: 0,
      maybe: 0,
      not_attending: 0
    };

    statusCounts.forEach(item => {
      counts[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      rsvps,
      counts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRSVPs: total,
        hasNext: skip + rsvps.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get event RSVPs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event RSVPs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete RSVP
const deleteRSVP = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // Find and delete the RSVP
    const rsvp = await RSVP.findOneAndDelete({
      user: userId,
      event: eventId
    });

    if (!rsvp) {
      return res.status(404).json({
        success: false,
        message: 'RSVP not found'
      });
    }

    // Get event and organizer details for notification
    const event = await Event.findById(eventId);
    const organizer = await User.findById(event.organizer);
    const user = await User.findById(userId);

    // Send notification to organizer about RSVP cancellation
    if (organizer && user) {
      try {
        await sendEmail(
          organizer.email,
          'RSVP Cancelled',
          `${user.firstName} ${user.lastName} has cancelled their RSVP for your event "${event.title}".`
        );
      } catch (emailError) {
        console.error('Failed to send RSVP cancellation notification:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'RSVP cancelled successfully'
    });

  } catch (error) {
    console.error('Delete RSVP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel RSVP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's RSVP status for a specific event
const getUserEventRSVP = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const rsvp = await RSVP.findOne({
      user: userId,
      event: eventId
    }).populate('event', 'title startDate endDate');

    if (!rsvp) {
      return res.status(404).json({
        success: false,
        message: 'No RSVP found for this event'
      });
    }

    res.status(200).json({
      success: true,
      rsvp
    });

  } catch (error) {
    console.error('Get user event RSVP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get RSVP status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createRSVP,
  getUserRSVPs,
  getEventRSVPs,
  deleteRSVP,
  getUserEventRSVP
};