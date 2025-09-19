import React, { useState, useEffect } from 'react';

const MaterialTimePicker = ({ 
  label, 
  value, 
  onChange, 
  required = false, 
  id,
  className = "" 
}) => {
  const [hour, setHour] = useState(1);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState('AM');
  const [isOpen, setIsOpen] = useState(false);
  const [isSelectingHour, setIsSelectingHour] = useState(true);
  const [isDialMode, setIsDialMode] = useState(true);

  // Convert 24-hour format to 12-hour format
  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const period = hours >= 12 ? 'PM' : 'AM';
      
      setHour(hour12);
      setMinute(minutes);
      setPeriod(period);
    }
  }, [value]);

  // Convert 12-hour format to 24-hour format and notify parent
  useEffect(() => {
    let hour24 = hour;
    if (period === 'AM' && hour === 12) hour24 = 0;
    if (period === 'PM' && hour !== 12) hour24 = hour + 12;
    
    const time24 = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onChange(time24);
  }, [hour, minute, period, onChange]);

  const formatTime = () => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const handleClockClick = (event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = event.clientX - centerX;
    const y = event.clientY - centerY;
    
    // Calculate angle using the same coordinate system as numbers and hand
    // atan2(x, -y) gives us angle from 12 o'clock position
    let angle = Math.atan2(x, -y) * (180 / Math.PI);
    if (angle < 0) angle += 360; // Normalize to 0-360
    
    if (isSelectingHour) {
      // Convert angle to hour: 0° = 12, 30° = 1, 60° = 2, etc.
      let selectedHour = Math.round(angle / 30);
      if (selectedHour === 0) selectedHour = 12;
      setHour(selectedHour);
    } else {
      // Convert angle to minute: 0° = 0, 6° = 1, 12° = 2, etc.
      const selectedMinute = Math.round(angle / 6) % 60;
      setMinute(selectedMinute);
    }
  };

  const getClockHandStyle = () => {
    if (isSelectingHour) {
      // For hours: 12 is at 0°, 1 is at 30°, 2 is at 60°, etc.
      // Use the same coordinate system as the numbers
      const adjustedHour = hour === 12 ? 0 : hour;
      const angle = adjustedHour * 30;
      return { transform: `rotate(${angle}deg)` };
    } else {
      // For minutes: 0 is at 0°, 5 is at 30°, 10 is at 60°, etc.
      const angle = (minute * 6);
      return { transform: `rotate(${angle}deg)` };
    }
  };

  const renderClockNumbers = () => {
    const numbers = isSelectingHour ? 
      Array.from({length: 12}, (_, i) => i + 1) :
      Array.from({length: 12}, (_, i) => i * 5);
    
    return numbers.map((num, index) => {
      // For a proper clock: 12 at top, 3 at right, 6 at bottom, 9 at left
      // Each number is 30° apart, starting from 12 at the top (0°)
      // Number 1 is at 30°, Number 2 is at 60°, etc.
      // Number 12 is at 330° (or -30°) which is 11 * 30°
      let angle;
      if (isSelectingHour) {
        // For hours: 12=0°, 1=30°, 2=60°, 3=90°, etc.
        angle = num === 12 ? 0 : num * 30;
      } else {
        // For minutes: 0=0°, 5=30°, 10=60°, etc.
        angle = (index * 30);
      }
      
      const angleRad = (angle * Math.PI) / 180;
      const radius = 85;
      const x = Math.sin(angleRad) * radius;
      const y = -Math.cos(angleRad) * radius;
      
      const isSelected = isSelectingHour ? 
        (num === hour) : 
        (num === minute || (num === 0 && minute === 0));
      
      return (
        <div
          key={num}
          className={`absolute w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium cursor-pointer transition-all duration-200 transform -translate-x-1/2 -translate-y-1/2 ${
            isSelected 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'text-gray-700 hover:bg-purple-50'
          }`}
          style={{
            left: `calc(50% + ${x}px)`,
            top: `calc(50% + ${y}px)`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isSelectingHour) {
              setHour(num);
            } else {
              setMinute(num);
            }
          }}
        >
          {num === 0 ? '00' : num}
        </div>
      );
    });
  };

  const handleHourInput = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= 12) {
      setHour(value);
    }
  };

  const handleMinuteInput = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 0 && value <= 59) {
      setMinute(value);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Time Display Input */}
      <div 
        className="relative w-full px-4 py-3 border border-gray-300 rounded-lg bg-white cursor-pointer transition-all duration-200 hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 shadow-sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-900 font-medium">
              {value ? formatTime() : 'Select time'}
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

      {/* Material Design 3 Time Picker Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(false);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Select time</h2>
                <div className="flex bg-gray-100 rounded-full p-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDialMode(true);
                    }}
                    className={`p-1.5 rounded-full transition-all duration-200 ${
                      isDialMode 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDialMode(false);
                    }}
                    className={`p-1.5 rounded-full transition-all duration-200 ${
                      !isDialMode 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5">
              {isDialMode ? (
                <>
                  {/* Time Display */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center space-x-1 mb-4">
                      <button
                        className={`px-3 py-1 rounded-xl text-4xl font-light transition-all duration-200 min-w-[80px] ${
                          isSelectingHour 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsSelectingHour(true);
                        }}
                      >
                        {hour.toString().padStart(2, '0')}
                      </button>
                      <span className="text-4xl font-light text-gray-400 px-1">:</span>
                      <button
                        className={`px-3 py-1 rounded-xl text-4xl font-light transition-all duration-200 min-w-[80px] ${
                          !isSelectingHour 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsSelectingHour(false);
                        }}
                      >
                        {minute.toString().padStart(2, '0')}
                      </button>
                    </div>
                    
                    {/* AM/PM Toggle */}
                    <div className="flex justify-center">
                      <div className="flex bg-gray-100 rounded-full p-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPeriod('AM');
                          }}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                            period === 'AM' 
                              ? 'bg-purple-600 text-white shadow-sm' 
                              : 'text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          AM
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPeriod('PM');
                          }}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                            period === 'PM' 
                              ? 'bg-purple-600 text-white shadow-sm' 
                              : 'text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Analog Clock */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div 
                        className="relative bg-gray-50 rounded-full cursor-pointer border-2 border-gray-200"
                        style={{ width: '260px', height: '260px' }}
                        onClick={handleClockClick}
                      >
                        {/* Clock Face */}
                        <div className="absolute inset-3 bg-white rounded-full shadow-inner">
                          {/* Clock Numbers */}
                          {renderClockNumbers()}
                          
                          {/* Center Dot */}
                          <div className="absolute top-1/2 left-1/2 w-2.5 h-2.5 bg-purple-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-30"></div>
                          
                          {/* Clock Hand */}
                          <div 
                            className="absolute top-1/2 left-1/2 origin-bottom bg-purple-600 z-20 transition-transform duration-300"
                            style={{
                              width: '2px',
                              height: '65px',
                              marginTop: '-65px',
                              marginLeft: '-1px',
                              borderRadius: '1px',
                              ...getClockHandStyle()
                            }}
                          >
                            {/* Hand Tip */}
                            <div className="absolute -top-1 left-1/2 w-1.5 h-1.5 bg-purple-600 rounded-full transform -translate-x-1/2"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Input Mode
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-3 mb-6">
                    <div className="text-center">
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Hour</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={hour}
                        onChange={handleHourInput}
                        className="w-20 px-3 py-4 text-3xl text-center border border-gray-300 rounded-2xl bg-gray-50 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                      />
                    </div>
                    <span className="text-3xl font-light text-gray-400 mt-6">:</span>
                    <div className="text-center">
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Minute</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={minute}
                        onChange={handleMinuteInput}
                        className="w-20 px-3 py-4 text-3xl text-center border border-gray-300 rounded-2xl bg-gray-50 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                      />
                    </div>
                  </div>
                  
                  {/* AM/PM Toggle */}
                  <div className="flex justify-center">
                    <div className="flex bg-gray-100 rounded-full p-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPeriod('AM');
                        }}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          period === 'AM' 
                            ? 'bg-purple-600 text-white shadow-sm' 
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        AM
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPeriod('PM');
                        }}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          period === 'PM' 
                            ? 'bg-purple-600 text-white shadow-sm' 
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="px-6 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 rounded-full transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="px-8 py-2 text-sm font-medium bg-purple-600 text-white rounded-full hover:bg-purple-700 hover:shadow-md transition-all duration-200"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialTimePicker;