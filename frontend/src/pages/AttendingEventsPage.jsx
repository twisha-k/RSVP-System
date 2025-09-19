import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { rsvpAPI } from '../services/api';

const AttendingEventsPage = () => {
  const { isAuthenticated } = useAuth();
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, attending, maybe, not_attending

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyRSVPs();
    }
  }, [isAuthenticated]);

  const fetchMyRSVPs = async () => {
    try {
      const response = await rsvpAPI.getMyRSVPs();
      setRsvps(response.data.rsvps || []);
    } catch (err) {
      setError('Failed to load your RSVPs');
    } finally {
      setLoading(false);
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

  const isEventPast = (dateString) => {
    return new Date(dateString) < new Date();
  };

  const getStatusBadge = (status) => {
    const styles = {
      attending: 'bg-green-100 text-green-800',
      maybe: 'bg-yellow-100 text-yellow-800',
      not_attending: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      attending: 'Attending',
      maybe: 'Maybe',
      not_attending: 'Not Attending'
    };

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredRSVPs = rsvps.filter(rsvp => {
    if (filter === 'all') return true;
    return rsvp.status === filter;
  });

  const upcomingRSVPs = filteredRSVPs.filter(rsvp => !isEventPast(rsvp.event.startDate));
  const pastRSVPs = filteredRSVPs.filter(rsvp => isEventPast(rsvp.event.startDate));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
          <p className="text-gray-600 mb-4">You need to be signed in to view your RSVPs.</p>
          <Link to="/login" className="text-blue-600 hover:text-blue-800">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My RSVPs</h1>
          <Link
            to="/"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse Events
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        {rsvps.length > 0 && (
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'all', label: `All (${rsvps.length})` },
                  { key: 'attending', label: `Attending (${rsvps.filter(r => r.status === 'attending').length})` },
                  { key: 'maybe', label: `Maybe (${rsvps.filter(r => r.status === 'maybe').length})` },
                  { key: 'not_attending', label: `Not Attending (${rsvps.filter(r => r.status === 'not_attending').length})` }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      filter === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {rsvps.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              You Haven't RSVP'd to Any Events Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Browse events and RSVP to join the community!
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Events
            </Link>
          </div>
        ) : filteredRSVPs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              No events found for this filter
            </h2>
            <p className="text-gray-600">
              Try selecting a different filter or browse more events.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Events */}
            {upcomingRSVPs.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Upcoming Events ({upcomingRSVPs.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingRSVPs.map((rsvp) => (
                    <div key={rsvp._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex space-x-2">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              {rsvp.event.category}
                            </span>
                            {getStatusBadge(rsvp.status)}
                          </div>
                          <Link
                            to={`/events/${rsvp.event._id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View Event
                          </Link>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {rsvp.event.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {rsvp.event.description}
                        </p>
                        
                        <div className="space-y-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(rsvp.event.startDate)}
                          </div>
                          
                          {rsvp.event.location?.city && (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {rsvp.event.location.venue && `${rsvp.event.location.venue}, `}
                              {rsvp.event.location.city}
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Organized by {rsvp.event.organizer?.firstName} {rsvp.event.organizer?.lastName}
                          </div>

                          <div className="text-xs text-gray-400 mt-2">
                            RSVP'd on {new Date(rsvp.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastRSVPs.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Past Events ({pastRSVPs.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastRSVPs.map((rsvp) => (
                    <div key={rsvp._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow opacity-75">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex space-x-2">
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                              {rsvp.event.category}
                            </span>
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                              Past
                            </span>
                            {getStatusBadge(rsvp.status)}
                          </div>
                          <Link
                            to={`/events/${rsvp.event._id}`}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                          >
                            View
                          </Link>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {rsvp.event.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {rsvp.event.description}
                        </p>
                        
                        <div className="space-y-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(rsvp.event.startDate)}
                          </div>
                          
                          {rsvp.event.location?.city && (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {rsvp.event.location.venue && `${rsvp.event.location.venue}, `}
                              {rsvp.event.location.city}
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Organized by {rsvp.event.organizer?.firstName} {rsvp.event.organizer?.lastName}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendingEventsPage;