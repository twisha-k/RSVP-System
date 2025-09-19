import React, { useState, useEffect } from 'react';
import TimePicker from './TimePicker';

const DateTimePicker = ({ 
  label, 
  value, 
  onChange, 
  required = false, 
  id,
  minDateTime = null,
  className = "" 
}) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // Convert datetime-local format to separate date and time
  const parseDateTime = (dateTimeValue) => {
    if (!dateTimeValue) return { date: '', time: '' };
    
    const [date, time] = dateTimeValue.split('T');
    return { date, time };
  };

  // Combine date and time into datetime-local format
  const combineDateTime = (date, time) => {
    if (!date || !time) return '';
    return `${date}T${time}`;
  };

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      const { date, time } = parseDateTime(value);
      setSelectedDate(date);
      setSelectedTime(time);
    }
  }, [value]);

  // Update parent component when date or time changes
  useEffect(() => {
    if (selectedDate && selectedTime) {
      const dateTimeValue = combineDateTime(selectedDate, selectedTime);
      onChange(dateTimeValue);
    }
  }, [selectedDate, selectedTime, onChange]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleTimeChange = (time) => {
    setSelectedTime(time);
  };

  // Get minimum date for date input
  const getMinDate = () => {
    if (minDateTime) {
      return parseDateTime(minDateTime).date;
    }
    return new Date().toISOString().split('T')[0]; // Today's date
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date Picker */}
        <div>
          <label htmlFor={`${id}-date`} className="block text-xs font-medium text-gray-500 mb-1">
            Date
          </label>
          <div className="relative">
            <input
              type="date"
              id={`${id}-date`}
              value={selectedDate}
              onChange={handleDateChange}
              min={getMinDate()}
              required={required}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <svg className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Time Picker */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Time
          </label>
          <TimePicker
            id={`${id}-time`}
            label=""
            value={selectedTime}
            onChange={handleTimeChange}
            required={required}
            className="w-full"
          />
        </div>
      </div>
      
      {/* Display combined value */}
      {selectedDate && selectedTime && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-700">
              Selected: {new Date(`${selectedDate}T${selectedTime}`).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;