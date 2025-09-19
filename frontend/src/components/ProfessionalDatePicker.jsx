import React, { useState, useEffect } from 'react';

const ProfessionalDatePicker = ({ 
  label, 
  value, 
  onChange, 
  required = false, 
  id,
  minDate = null,
  className = "" 
}) => {
  const [selectedDate, setSelectedDate] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      const date = new Date(value);
      setCurrentMonth(date.getMonth());
      setCurrentYear(date.getFullYear());
    }
  }, [value]);

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'Select date';
    
    // Parse date string safely to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
    
    const options = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Previous month's trailing days
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevMonth, prevYear);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        isNextMonth: false,
        date: new Date(prevYear, prevMonth, daysInPrevMonth - i)
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        isNextMonth: false,
        date: new Date(currentYear, currentMonth, day)
      });
    }

    // Next month's leading days
    const remainingDays = 42 - days.length;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isNextMonth: true,
        date: new Date(nextYear, nextMonth, day)
      });
    }

    return days;
  };

  const handleDateSelect = (date) => {
    // Fix timezone issue by using local date formatting
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    setSelectedDate(dateStr);
    onChange(dateStr);
    setIsOpen(false);
  };

  const navigateMonth = (direction) => {
    // Prevent propagation to avoid form validation triggers
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
    // Don't call onChange here - only call it when a date is actually selected
  };

  const isDateDisabled = (date) => {
    if (minDate) {
      const min = new Date(minDate);
      return date < min;
    }
    return false;
  };

  const isDateSelected = (date) => {
    if (!selectedDate) return false;
    
    // Compare dates using local date components to avoid timezone issues
    const [selectedYear, selectedMonth, selectedDay] = selectedDate.split('-').map(Number);
    const dateYear = date.getFullYear();
    const dateMonth = date.getMonth() + 1; // getMonth() returns 0-11, but we need 1-12
    const dateDay = date.getDate();
    
    return selectedYear === dateYear && selectedMonth === dateMonth && selectedDay === dateDay;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Date Display Input */}
      <div 
        className="relative w-full px-4 py-3 border border-gray-300 rounded-lg bg-white cursor-pointer transition-all duration-200 hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-900 font-medium">
              {formatDisplayDate(selectedDate)}
            </span>
          </div>
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden min-w-80">
          <div className="p-4">
            
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigateMonth('prev');
                }}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-150"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {months[currentMonth]} {currentYear}
                </h3>
              </div>
              
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigateMonth('next');
                }}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-150"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="p-2 text-center">
                  <span className="text-xs font-medium text-gray-500">
                    {day}
                  </span>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dayObj, index) => {
                const isDisabled = isDateDisabled(dayObj.date);
                const isSelected = isDateSelected(dayObj.date);
                const isTodayDate = isToday(dayObj.date);
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isDisabled) {
                        handleDateSelect(dayObj.date);
                      }
                    }}
                    disabled={isDisabled}
                    className={`
                      p-2 text-sm font-medium rounded-md transition-all duration-150 relative
                      ${dayObj.isCurrentMonth 
                        ? 'text-gray-900' 
                        : 'text-gray-400'
                      }
                      ${isSelected 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'hover:bg-gray-100'
                      }
                      ${isTodayDate && !isSelected 
                        ? 'bg-blue-50 text-blue-600 font-semibold' 
                        : ''
                      }
                    `}
                  >
                    {dayObj.day}
                    {isTodayDate && !isSelected && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ProfessionalDatePicker;