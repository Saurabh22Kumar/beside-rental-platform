'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, Settings } from 'lucide-react';

interface UnavailableDate {
  id: string;
  unavailable_date: string;
  is_recurring: boolean;
  recurring_type?: string;
}

interface CalendarManagerProps {
  itemId: string;
  ownerEmail: string;
}

const CalendarManager: React.FC<CalendarManagerProps> = ({
  itemId,
  ownerEmail
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringType, setRecurringType] = useState<'weekly' | 'monthly'>('weekly');
  const [submitting, setSubmitting] = useState(false);

  // Navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  useEffect(() => {
    fetchUnavailableDates();
  }, [itemId]);

  const fetchUnavailableDates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/items/${itemId}/unavailable`);
      if (response.ok) {
        const data = await response.json();
        setUnavailableDates(data.unavailableDates || []);
      }
    } catch (error) {
      console.error('Error fetching unavailable dates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isDateUnavailable = (date: string) => {
    return unavailableDates.some(u => u.unavailable_date === date);
  };

  const isDateSelected = (date: string) => {
    return selectedDates.includes(date);
  };

  const getDateClasses = (date: string, isCurrentMonth: boolean) => {
    const baseClasses = 'w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold cursor-pointer transition-colors';
    const opacity = isCurrentMonth ? '' : 'opacity-30';
    
    if (isDateSelected(date)) {
      return `${baseClasses} bg-blue-400 text-blue-900 ${opacity}`;
    } else if (isDateUnavailable(date)) {
      return `${baseClasses} bg-red-300 text-red-900 ${opacity}`;
    } else {
      return `${baseClasses} hover:bg-gray-200 text-gray-900 ${opacity}`;
    }
  };

  const handleDateClick = (dateString: string) => {
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(dateString);
    if (checkDate < today) {
      return; // Don't allow selecting past dates
    }

    if (isDateSelected(dateString)) {
      setSelectedDates(prev => prev.filter(d => d !== dateString));
    } else {
      setSelectedDates(prev => [...prev, dateString]);
    }
  };

  const handleAddUnavailableDates = async () => {
    if (selectedDates.length === 0) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/items/${itemId}/unavailable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerEmail,
          dates: selectedDates,
          isRecurring: false
        }),
      });

      if (response.ok) {
        setSelectedDates([]);
        fetchUnavailableDates();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add unavailable dates');
      }
    } catch (error) {
      console.error('Error adding unavailable dates:', error);
      alert('Failed to add unavailable dates');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveUnavailableDates = async () => {
    const datesToRemove = selectedDates.filter(date => isDateUnavailable(date));
    if (datesToRemove.length === 0) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/items/${itemId}/unavailable`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerEmail,
          dates: datesToRemove
        }),
      });

      if (response.ok) {
        setSelectedDates([]);
        fetchUnavailableDates();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove unavailable dates');
      }
    } catch (error) {
      console.error('Error removing unavailable dates:', error);
      alert('Failed to remove unavailable dates');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecurringDates = async () => {
    if (selectedDates.length === 0) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/items/${itemId}/unavailable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerEmail,
          dates: selectedDates,
          isRecurring: true,
          recurringType
        }),
      });

      if (response.ok) {
        setSelectedDates([]);
        setShowRecurringModal(false);
        fetchUnavailableDates();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to set recurring unavailable dates');
      }
    } catch (error) {
      console.error('Error setting recurring dates:', error);
      alert('Failed to set recurring unavailable dates');
    } finally {
      setSubmitting(false);
    }
  };

  const generateWeekendDates = () => {
    const dates = [];
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        const dateString = date.toISOString().split('T')[0];
        if (!isDateUnavailable(dateString)) {
          dates.push(dateString);
        }
      }
    }
    
    setSelectedDates(dates);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Manage Unavailable Dates
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium min-w-[140px] text-center">{monthYear}</span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={generateWeekendDates}
          className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm hover:bg-blue-200 transition-colors"
        >
          Select Weekends
        </button>
        <button
          onClick={() => setSelectedDates([])}
          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm hover:bg-gray-200 transition-colors"
        >
          Clear Selection
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 rounded"></div>
          <span>Currently Unavailable</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const dateString = formatDateForAPI(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          
          return (
            <div
              key={index}
              className={getDateClasses(dateString, isCurrentMonth)}
              onClick={() => handleDateClick(dateString)}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      {selectedDates.length > 0 && (
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600 mr-2">
            {selectedDates.length} date(s) selected
          </span>
          <button
            onClick={handleAddUnavailableDates}
            disabled={submitting}
            className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
          >
            <Plus className="w-3 h-3" />
            Mark Unavailable
          </button>
          <button
            onClick={handleRemoveUnavailableDates}
            disabled={submitting}
            className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" />
            Mark Available
          </button>
          <button
            onClick={() => setShowRecurringModal(true)}
            disabled={submitting}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <Calendar className="w-3 h-3" />
            Set Recurring
          </button>
        </div>
      )}

      {/* Recurring Dates Modal */}
      {showRecurringModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h4 className="text-lg font-semibold mb-4">Set Recurring Unavailable Dates</h4>
            <p className="text-gray-600 mb-4">
              Set the selected {selectedDates.length} date(s) as recurring unavailable dates.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recurring Type:
              </label>
              <select
                value={recurringType}
                onChange={(e) => setRecurringType(e.target.value as 'weekly' | 'monthly')}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="weekly">Weekly (every week)</option>
                <option value="monthly">Monthly (every month)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRecurringDates}
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Setting...' : 'Set Recurring'}
              </button>
              <button
                onClick={() => setShowRecurringModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarManager;