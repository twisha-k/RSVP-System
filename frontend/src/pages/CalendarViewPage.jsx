import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI } from '../services/api';

const CalendarViewPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getAllEvents();
      setEvents(response.data.events || []);
    } catch (err) {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty days for the previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const getWeekDates = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + i);
      weekDates.push(dayDate);
    }
    return weekDates;
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Event Calendar</h1>
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setView('month')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                  view === 'month'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border-l-0 border ${
                  view === 'week'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Week
              </button>
            </div>
            
            <Link
              to="/"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              List View
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Calendar Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <button
              onClick={() => view === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900">
              {view === 'month' ? (
                `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              ) : (
                `Week of ${getWeekDates(currentDate)[0].toLocaleDateString()}`
              )}
            </h2>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => view === 'month' ? navigateMonth(1) : navigateWeek(1)}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          {view === 'month' ? (
            <div className="p-6">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-700">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentDate).map((date, index) => {
                  const dayEvents = getEventsForDate(date);
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 border border-gray-200 ${
                        date ? 'bg-white' : 'bg-gray-50'
                      } ${isToday(date) ? 'bg-blue-50 border-blue-300' : ''}`}
                    >
                      {date && (
                        <>
                          <div className={`text-sm font-medium mb-2 ${
                            isToday(date) ? 'text-blue-600' : 'text-gray-900'
                          }`}>
                            {date.getDate()}
                          </div>
                          
                          <div className="space-y-1">
                            {dayEvents.slice(0, 2).map(event => (
                              <Link
                                key={event._id}
                                to={`/events/${event._id}`}
                                className="block p-1 text-xs bg-blue-100 text-blue-800 rounded truncate hover:bg-blue-200 transition-colors"
                                title={event.title}
                              >
                                {formatTime(event.startDate)} {event.title}
                              </Link>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Week View */
            <div className="p-6">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-4 mb-4">
                {getWeekDates(currentDate).map((date, index) => (
                  <div key={index} className="text-center">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      {dayNames[index]}
                    </div>
                    <div className={`text-lg font-semibold ${
                      isToday(date) ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Week Days */}
              <div className="grid grid-cols-7 gap-4">
                {getWeekDates(currentDate).map((date, index) => {
                  const dayEvents = getEventsForDate(date);
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[400px] p-3 border border-gray-200 rounded-lg ${
                        isToday(date) ? 'bg-blue-50 border-blue-300' : 'bg-white'
                      }`}
                    >
                      <div className="space-y-2">
                        {dayEvents.map(event => (
                          <Link
                            key={event._id}
                            to={`/events/${event._id}`}
                            className="block p-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                          >
                            <div className="font-medium text-sm">{formatTime(event.startDate)}</div>
                            <div className="text-xs truncate">{event.title}</div>
                            <div className="text-xs opacity-75">{event.category}</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Events List */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Events</h3>
          
          {events.filter(event => new Date(event.startDate) > new Date()).length > 0 ? (
            <div className="space-y-4">
              {events
                .filter(event => new Date(event.startDate) > new Date())
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .slice(0, 5)
                .map(event => (
                  <div key={event._id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {event.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(event.startDate)}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                      <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
                      {event.location?.city && (
                        <p className="text-gray-500 text-sm mt-1">📍 {event.location.city}</p>
                      )}
                    </div>
                    <Link
                      to={`/events/${event._id}`}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No upcoming events found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarViewPage;