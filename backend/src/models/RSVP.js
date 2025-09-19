const mongoose = require('mongoose');

const rsvpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  status: {
    type: String,
    enum: ['joined', 'maybe', 'cancelled'],
    required: true,
    default: 'joined'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters'],
    default: ''
  },
  guests: {
    type: Number,
    default: 0,
    min: [0, 'Number of guests cannot be negative'],
    max: [10, 'Cannot bring more than 10 guests']
  },
  specialRequests: {
    type: String,
    maxlength: [300, 'Special requests cannot be more than 300 characters'],
    default: ''
  },
  checkInTime: {
    type: Date
  },
  isCheckedIn: {
    type: Boolean,
    default: false
  },
  reminderSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure one RSVP per user per event
rsvpSchema.index({ userId: 1, eventId: 1 }, { unique: true });

// Additional indexes for queries
rsvpSchema.index({ eventId: 1, status: 1 });
rsvpSchema.index({ userId: 1, status: 1 });
rsvpSchema.index({ createdAt: -1 });

// Virtual for total attendees (including guests)
rsvpSchema.virtual('totalAttendees').get(function() {
  return 1 + this.guests;
});

// Middleware to update event attendees when RSVP changes
rsvpSchema.post('save', async function() {
  const Event = mongoose.model('Event');
  const event = await Event.findById(this.eventId);
  
  if (event) {
    // Remove existing attendee entry
    event.attendees = event.attendees.filter(
      attendee => attendee.user.toString() !== this.userId.toString()
    );
    
    // Add new attendee entry if status is not cancelled
    if (this.status !== 'cancelled') {
      event.attendees.push({
        user: this.userId,
        joinedAt: this.createdAt,
        status: this.status
      });
    }
    
    await event.save();
  }
});

// Middleware to update event attendees when RSVP is deleted
rsvpSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Event = mongoose.model('Event');
    const event = await Event.findById(doc.eventId);
    
    if (event) {
      event.attendees = event.attendees.filter(
        attendee => attendee.user.toString() !== doc.userId.toString()
      );
      await event.save();
    }
  }
});

// Static method to get RSVP statistics for an event
rsvpSchema.statics.getEventStats = async function(eventId) {
  const stats = await this.aggregate([
    { $match: { eventId: mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalGuests: { $sum: '$guests' }
      }
    }
  ]);
  
  const result = {
    joined: { count: 0, totalGuests: 0 },
    maybe: { count: 0, totalGuests: 0 },
    cancelled: { count: 0, totalGuests: 0 }
  };
  
  stats.forEach(stat => {
    result[stat._id] = {
      count: stat.count,
      totalGuests: stat.totalGuests
    };
  });
  
  return result;
};

// Static method to get user's RSVPs
rsvpSchema.statics.getUserRSVPs = async function(userId, status = null) {
  const query = { userId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('eventId', 'title date time location category image')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('RSVP', rsvpSchema);