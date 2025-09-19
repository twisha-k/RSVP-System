import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI } from '../services/api';
import AnimatedButton from '../components/AnimatedButton';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    date: ''
  });

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getEvents(filters);
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeObj) => {
    if (typeof timeObj === 'string') {
      return new Date(`2000-01-01T${timeObj}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    if (timeObj && timeObj.start) {
      return new Date(`2000-01-01T${timeObj.start}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    return 'Time TBD';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {isAuthenticated ? `Welcome back, ${user?.name}!` : 'Discover Amazing Events'}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Connect with your community through exciting events and meetups
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/events" 
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Explore All Events
                </Link>
                <Link 
                  to="/create-event" 
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Create Event
                </Link>
                <Link 
                  to="/my-events" 
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  My Events
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/events" 
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Explore All Events
                </Link>
                <Link 
                  to="/signup" 
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Get Started
                </Link>
                <Link 
                  to="/login" 
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Find Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="Technology">Technology</option>
                  <option value="Business">Business</option>
                  <option value="Health & Wellness">Health & Wellness</option>
                  <option value="Education">Education</option>
                  <option value="Arts & Culture">Arts & Culture</option>
                  <option value="Sports & Fitness">Sports & Fitness</option>
                  <option value="Food & Drink">Food & Drink</option>
                  <option value="Music">Music</option>
                  <option value="Social">Social</option>
                  <option value="Networking">Networking</option>
                  <option value="Other">Other</option>
                </select>
                
                <input
                  type="text"
                  placeholder="Location"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Events List */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
                <AnimatedButton 
                  to="/events"
                  size="medium"
                >
                  Explore All Events
                </AnimatedButton>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                  <p className="text-gray-500">Try adjusting your filters or create a new event.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {events.map((event) => (
                    <div key={event._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="md:flex">
                        <div className="md:w-1/3">
                          <img
                            src={event.image || '/api/placeholder/400/250'}
                            alt={event.title}
                            className="w-full h-48 md:h-full object-cover"
                          />
                        </div>
                        <div className="md:w-2/3 p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                <Link to={`/events/${event._id}`} className="hover:text-blue-600">
                                  {event.title}
                                </Link>
                              </h3>
                              <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                              
                              <div className="space-y-2 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {formatDate(event.date)} at {formatTime(event.time)}
                                </div>
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {event.location?.city && event.location?.state 
                                    ? `${event.location.city}, ${event.location.state}` 
                                    : event.location?.address || 'Location TBD'}
                                </div>
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  {event.attendees?.length || 0} / {event.capacity} attendees
                                </div>
                              </div>
                            </div>
                            
                            <div className="ml-4">
                              <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                                {event.category}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-between items-center">
                            <AnimatedButton 
                              to={`/events/${event._id}`}
                              size="small"
                            >
                              View Details
                            </AnimatedButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/create-event"
                      className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Event
                    </Link>
                    <Link
                      to="/my-events"
                      className="block w-full border border-blue-600 text-blue-600 text-center py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      My Events
                    </Link>
                    <Link
                      to="/attending-events"
                      className="block w-full border border-gray-300 text-gray-700 text-center py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Attending
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Join EventHub
                    </Link>
                    <Link
                      to="/login"
                      className="block w-full border border-blue-600 text-blue-600 text-center py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Popular Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setFilters({ ...filters, category: '' })}
                  className={`block w-full text-left text-sm py-2 px-3 rounded-md transition-colors ${
                    filters.category === '' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  All Categories
                </button>
                {['Technology', 'Business', 'Health & Wellness', 'Education', 'Arts & Culture'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setFilters({ ...filters, category: category })}
                    className={`block w-full text-left text-sm py-2 px-3 rounded-md transition-colors ${
                      filters.category === category 
                        ? 'bg-blue-100 text-blue-700 font-medium' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;