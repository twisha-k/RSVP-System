import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI, rsvpAPI, commentsAPI } from '../services/api';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [userRSVP, setUserRSVP] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rsvpLoading, setRSVPLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    fetchComments();
    if (isAuthenticated) {
      fetchUserRSVP();
    }
  }, [id, isAuthenticated]);

  const fetchEventDetails = async () => {
    try {
      const response = await eventsAPI.getEvent(id);
      setEvent(response.data.event);
    } catch (err) {
      setError('Event not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRSVP = async () => {
    try {
      const response = await rsvpAPI.getUserEventRSVP(id);
      setUserRSVP(response.data.rsvp);
    } catch (err) {
      // User hasn't RSVP'd yet
      setUserRSVP(null);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await commentsAPI.getEventComments(id);
      setComments(response.data.comments || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleRSVP = async (status) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setRSVPLoading(true);
      await rsvpAPI.createRSVP(id, { status });
      fetchUserRSVP();
      fetchEventDetails(); // Refresh to update attendee count
    } catch (err) {
      alert('Failed to RSVP. Please try again.');
    } finally {
      setRSVPLoading(false);
    }
  };

  const handleCancelRSVP = async () => {
    try {
      setRSVPLoading(true);
      await rsvpAPI.deleteRSVP(id);
      setUserRSVP(null);
      fetchEventDetails(); // Refresh to update attendee count
    } catch (err) {
      alert('Failed to cancel RSVP. Please try again.');
    } finally {
      setRSVPLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      await commentsAPI.createComment(id, { content: commentText });
      setCommentText('');
      fetchComments();
    } catch (err) {
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isEventPast = event && new Date(event.startDate) < new Date();
  const isOrganizer = event && user && event.organizer._id === user.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </Link>

        {/* Event Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                    {event.category}
                  </span>
                  {isEventPast && (
                    <span className="ml-2 bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
                      Past Event
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {event.title}
                </h1>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {event.description}
                </p>
              </div>

              {isOrganizer && (
                <div className="ml-6">
                  <Link
                    to={`/events/${event._id}/edit`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Edit Event
                  </Link>
                </div>
              )}
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-3 mt-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Date & Time</p>
                    <p className="text-gray-600">{formatDate(event.startDate)}</p>
                    {event.endDate && (
                      <p className="text-gray-600">to {formatDate(event.endDate)}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-3 mt-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Location</p>
                    {event.location?.venue && (
                      <p className="text-gray-600">{event.location.venue}</p>
                    )}
                    <p className="text-gray-600">
                      {event.location?.address && `${event.location.address}, `}
                      {event.location?.city && `${event.location.city}`}
                      {event.location?.state && `, ${event.location.state}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-3 mt-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Organizer</p>
                    <p className="text-gray-600">
                      {event.organizer?.firstName} {event.organizer?.lastName}
                    </p>
                  </div>
                </div>

                {event.maxAttendees && (
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-3 mt-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-900">Capacity</p>
                      <p className="text-gray-600">Max {event.maxAttendees} attendees</p>
                    </div>
                  </div>
                )}
              </div>

              {/* RSVP Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">RSVP to this event</h3>
                
                {!isEventPast && !isOrganizer && (
                  <div className="space-y-3">
                    {userRSVP ? (
                      <div>
                        <p className="text-sm text-gray-600 mb-3">
                          Your current status: <span className="font-semibold">{userRSVP.status}</span>
                        </p>
                        <div className="space-y-2">
                          <button
                            onClick={() => handleRSVP('attending')}
                            disabled={rsvpLoading}
                            className={`w-full px-4 py-2 rounded-md transition-colors ${
                              userRSVP.status === 'attending'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Attending
                          </button>
                          <button
                            onClick={() => handleRSVP('maybe')}
                            disabled={rsvpLoading}
                            className={`w-full px-4 py-2 rounded-md transition-colors ${
                              userRSVP.status === 'maybe'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Maybe
                          </button>
                          <button
                            onClick={() => handleRSVP('not_attending')}
                            disabled={rsvpLoading}
                            className={`w-full px-4 py-2 rounded-md transition-colors ${
                              userRSVP.status === 'not_attending'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Can't Attend
                          </button>
                          <button
                            onClick={handleCancelRSVP}
                            disabled={rsvpLoading}
                            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                          >
                            Cancel RSVP
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleRSVP('attending')}
                          disabled={rsvpLoading}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          I'm Attending
                        </button>
                        <button
                          onClick={() => handleRSVP('maybe')}
                          disabled={rsvpLoading}
                          className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                        >
                          Maybe
                        </button>
                        <button
                          onClick={() => handleRSVP('not_attending')}
                          disabled={rsvpLoading}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          Can't Attend
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {isEventPast && (
                  <p className="text-gray-600">This event has already passed.</p>
                )}

                {isOrganizer && (
                  <p className="text-gray-600">You are the organizer of this event.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Comments</h3>

          {/* Comment Form */}
          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts about this event..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-gray-50 rounded-md">
              <p className="text-gray-600">
                <Link to="/login" className="text-blue-600 hover:text-blue-800">
                  Sign in
                </Link>
                {' '}to leave a comment.
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment._id} className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-center mb-2">
                    <span className="font-semibold text-gray-900">
                      {comment.author?.firstName} {comment.author?.lastName}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                  
                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 ml-6 space-y-4">
                      {comment.replies.map((reply) => (
                        <div key={reply._id} className="border-l-2 border-gray-200 pl-4">
                          <div className="flex items-center mb-2">
                            <span className="font-semibold text-gray-900">
                              {reply.author?.firstName} {reply.author?.lastName}
                            </span>
                            <span className="text-gray-500 text-sm ml-2">
                              {new Date(reply.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No comments yet. Be the first to share your thoughts!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;