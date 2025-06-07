'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, CheckCircle, XCircle, Plus, Trash2, Settings } from 'lucide-react';

interface BookingData {
  id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  renter_email: string;
  owner_email: string;
  total_days: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  user?: {
    phone?: string;
  };
}

interface UnavailableDate {
  id: string;
  unavailable_date: string;
  is_recurring: boolean;
  recurring_type?: string;
}

interface BookingCalendarProps {
  itemId: string;
  ownerEmail: string;
  userEmail?: string;
  isOwner?: boolean;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  itemId,
  ownerEmail,
  userEmail,
  isOwner = false
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedUnavailableDates, setSelectedUnavailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'booking' | 'unavailable'>('booking');

  // Format month and year for display
  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        // For non-owners, don't allow navigation to previous months
        if (!isOwner) {
          const today = new Date();
          const currentMonth = today.getFullYear() * 12 + today.getMonth();
          const prevMonth = newDate.getFullYear() * 12 + (newDate.getMonth() - 1);
          if (prevMonth < currentMonth) {
            return prev; // Don't navigate to previous month for users
          }
        }
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const canNavigateToPrevious = () => {
    if (isOwner) return false; // Owners can navigate to any month
    
    const today = new Date();
    const currentMonth = today.getFullYear() * 12 + today.getMonth();
    const displayMonth = currentDate.getFullYear() * 12 + currentDate.getMonth();
    
    return displayMonth <= currentMonth;
  };

  // Fetch booking data
  useEffect(() => {
    fetchBookingData();
  }, [itemId]);

  const fetchBookingData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/items/${itemId}/bookings?userEmail=${userEmail}&ownerEmail=${ownerEmail}`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
        setUnavailableDates(data.unavailableDates || []);
      } else {
        console.error('Failed to fetch booking data');
      }
    } catch (error) {
      console.error('Error fetching booking data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Date formatting helper
  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Get status of a specific date
  const getDateStatus = (dateString: string) => {
    const currentDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if date is in the past
    if (currentDate < today) {
      return 'past';
    }

    // Check for confirmed bookings (booked)
    const confirmedBooking = bookings.find(b => {
      const startDate = new Date(b.start_date);
      const endDate = new Date(b.end_date);
      return currentDate >= startDate && currentDate <= endDate && b.status === 'confirmed';
    });
    if (confirmedBooking) {
      return 'booked';
    }

    // Check for pending bookings
    const pendingBooking = bookings.find(b => {
      const startDate = new Date(b.start_date);
      const endDate = new Date(b.end_date);
      return currentDate >= startDate && currentDate <= endDate && b.status === 'pending';
    });
    
    if (pendingBooking) {
      // Show pending for all users so they can see when dates are potentially booked
      if (isOwner || pendingBooking.renter_email === userEmail) {
        return 'pending';
      } else {
        // Other users see pending requests as pending too
        return 'pending';
      }
    }

    // Check if owner has marked date as unavailable
    const isOwnerUnavailable = unavailableDates.some(u => u.unavailable_date === dateString);
    if (isOwnerUnavailable) {
      return 'owner-blocked';
    }

    return 'available';
  };

  // Get CSS classes for date cells
  const getDateClasses = (status: string) => {
    const baseClasses = 'h-10 flex items-center justify-center text-sm font-medium rounded cursor-pointer transition-colors';
    
    switch (status) {
      case 'booked':
      case 'owner-blocked':
        return `${baseClasses} bg-red-300 text-red-900 hover:bg-red-400`;
      case 'pending':
        return `${baseClasses} bg-yellow-300 text-yellow-900 hover:bg-yellow-400`;
      case 'available':
        return `${baseClasses} bg-green-300 text-green-900 hover:bg-green-400`;
      case 'past':
        return `${baseClasses} bg-gray-300 text-gray-700 cursor-not-allowed`;
      default:
        return `${baseClasses} hover:bg-gray-200 text-gray-900`;
    }
  };

  // Handle date click
  const handleDateClick = (dateString: string) => {
    const status = getDateStatus(dateString);
    
    if (status === 'past' || status === 'owner-blocked') {
      return; // Don't allow interaction with unavailable dates
    }

    if (isOwner) {
      // Owner can manage pending bookings
      if (status === 'pending') {
        setSelectedDate(dateString);
      }
    } else {
      // Users can request booking for available dates
      if (status === 'available' && userEmail) {
        setSelectedDate(dateString);
        setShowBookingModal(true);
      }
    }
  };

  const handleBookingRequest = async () => {
    if (!selectedDate || !userEmail) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/items/${itemId}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          ownerEmail,
          startDate: selectedDate,
          endDate: selectedDate,
          notes: bookingNotes
        }),
      });

      if (response.ok) {
        setShowBookingModal(false);
        setSelectedDate(null);
        setBookingNotes('');
        fetchBookingData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to request booking');
      }
    } catch (error) {
      console.error('Error requesting booking:', error);
      alert('Failed to request booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'confirmed' | 'rejected') => {
    try {
      const response = await fetch(`/api/items/${itemId}/bookings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          status: action,
          ownerEmail
        }),
      });

      if (response.ok) {
        fetchBookingData(); // Refresh data
        setSelectedDate(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking');
    }
  };

  // Cancel booking handler for both requester and owner
  const handleCancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}/bookings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          status: 'cancelled',
          userEmail: isOwner ? undefined : userEmail,
          ownerEmail: isOwner ? ownerEmail : undefined
        }),
      });
      if (response.ok) {
        fetchBookingData();
        setSelectedDate(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    }
  }

  // Unavailable date management functions for owners
  const isDateUnavailable = (date: string) => {
    return unavailableDates.some(u => u.unavailable_date === date);
  };

  const handleAddUnavailableDates = async () => {
    const availableDates = selectedUnavailableDates.filter(date => !isDateUnavailable(date));
    if (availableDates.length === 0) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/items/${itemId}/unavailable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerEmail,
          dates: availableDates,
          isRecurring: false
        }),
      });

      if (response.ok) {
        setSelectedUnavailableDates([]);
        fetchBookingData();
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
    const datesToRemove = selectedUnavailableDates.filter(date => isDateUnavailable(date));
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
        setSelectedUnavailableDates([]);
        fetchBookingData();
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const selectedBooking = selectedDate ? bookings.find(b => {
    const startDate = new Date(b.start_date);
    const endDate = new Date(b.end_date);
    const currentDate = new Date(selectedDate);
    return currentDate >= startDate && currentDate <= endDate;
  }) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border">
      {/* Header with mode switching for owners */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {isOwner ? 'Manage Bookings & Availability' : 'Check Availability'}
        </h3>
        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('booking')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                mode === 'booking' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Booking Requests
            </button>
            <button
              onClick={() => setMode('unavailable')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                mode === 'unavailable' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Set Unavailable
            </button>
          </div>
        )}
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={() => navigateMonth('prev')}
          disabled={canNavigateToPrevious()}
          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h4 className="text-lg font-semibold">{monthYear}</h4>
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Owner Controls for Unavailable Mode */}
      {isOwner && mode === 'unavailable' && (
        <div className="p-4 border-b bg-gray-50">
          <p className="text-sm text-gray-600 mb-3">
            Select dates to mark as unavailable. Selected: {selectedUnavailableDates.length} dates
          </p>
          {selectedUnavailableDates.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleAddUnavailableDates}
                disabled={submitting}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add as Unavailable
              </button>
              <button
                onClick={handleRemoveUnavailableDates}
                disabled={submitting}
                className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-300 rounded"></div>
            <span className="font-medium text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-300 rounded"></div>
            <span className="font-medium text-gray-700">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-300 rounded"></div>
            <span className="font-medium text-gray-700">Booked/Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <span className="font-medium text-gray-700">Past</span>
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
            const status = getDateStatus(dateString);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isSelected = selectedUnavailableDates.includes(dateString);
            
            return (
              <div
                key={index}
                className={`${getDateClasses(status)} ${!isCurrentMonth ? 'opacity-30' : ''} ${
                  isOwner && mode === 'unavailable' && isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => {
                  if (isOwner && mode === 'unavailable') {
                    // Toggle selection for unavailable mode
                    setSelectedUnavailableDates(prev => 
                      prev.includes(dateString) 
                        ? prev.filter(d => d !== dateString)
                        : [...prev, dateString]
                    );
                  } else {
                    handleDateClick(dateString);
                  }
                }}
              >
                {day.getDate()}
              </div>
            );
          })}
        </div>

        {/* Booking Request Modal */}
        {showBookingModal && selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h4 className="text-lg font-semibold mb-4">Request Booking</h4>
              <p className="text-gray-600 mb-4">
                Request to book this item for {new Date(selectedDate).toLocaleDateString()}
              </p>
              <textarea
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Add any notes or special requests..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={3}
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleBookingRequest}
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Requesting...' : 'Request Booking'}
                </button>
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedDate(null);
                    setBookingNotes('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Owner Booking Management Panel */}
        {isOwner && selectedBooking && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Booking Request</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Dates:</span> {new Date(selectedBooking.start_date).toLocaleDateString()} - {new Date(selectedBooking.end_date).toLocaleDateString()}</p>
              <p><span className="font-medium">User:</span> {selectedBooking.renter_email}</p>
              {selectedBooking.user?.phone && (
                <p><span className="font-medium">Phone:</span> {selectedBooking.user.phone}</p>
              )}
              <p><span className="font-medium">Total Days:</span> {selectedBooking.total_days}</p>
              <p><span className="font-medium">Total Amount:</span> ₹{selectedBooking.total_amount}</p>
              {selectedBooking.notes && (
                <p><span className="font-medium">Notes:</span> {selectedBooking.notes}</p>
              )}
              <p><span className="font-medium">Status:</span> 
                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                  selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedBooking.status}
                </span>
              </p>
            </div>
            {selectedBooking.status === 'pending' && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleBookingAction(selectedBooking.id, 'confirmed')}
                  className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  <CheckCircle className="w-3 h-3" />
                  Approve
                </button>
                <button
                  onClick={() => handleBookingAction(selectedBooking.id, 'rejected')}
                  className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  <XCircle className="w-3 h-3" />
                  Reject
                </button>
                <button
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                  className="flex items-center gap-1 bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Booking Requests List - Only visible to requester and owner */}
        {userEmail && bookings.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              {isOwner ? 'All Booking Requests' : 'My Booking Requests'}
            </h4>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`p-3 rounded-lg border-l-4 bg-white cursor-pointer hover:shadow-md transition-shadow ${
                    booking.status === 'pending' ? 'border-l-yellow-400' :
                    booking.status === 'confirmed' ? 'border-l-green-400' :
                    'border-l-red-400'
                  }`}
                  onClick={() => setSelectedDate(booking.start_date)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {new Date(booking.start_date).toLocaleDateString()} 
                          {booking.start_date !== booking.end_date && ` - ${new Date(booking.end_date).toLocaleDateString()}`}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      {isOwner && (
                        <p className="text-xs text-gray-600 mb-1">
                          Requested by: {booking.renter_email}
                          {booking.user?.phone && (
                            <span className="ml-2 text-gray-500">({booking.user.phone})</span>
                          )}
                        </p>
                      )}
                      {!isOwner && booking.status === 'pending' && (
                        <p className="text-xs text-gray-600 mb-1">
                          Waiting for owner approval
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {booking.total_days} day{booking.total_days > 1 ? 's' : ''} • ₹{booking.total_amount}
                      </p>
                      {booking.notes && (
                        <p className="text-xs text-gray-600 mt-1 italic">
                          "{booking.notes}"
                        </p>
                      )}
                    </div>
                    {/* Cancel button for requester on their own pending or confirmed booking */}
                    {!isOwner && (booking.status === 'pending' || booking.status === 'confirmed') && booking.renter_email === userEmail && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleCancelBooking(booking.id);
                        }}
                        className="ml-2 p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold"
                        title="Cancel Request"
                      >
                        Cancel
                      </button>
                    )}
                    {/* Owner buttons for pending bookings */}
                    {isOwner && booking.status === 'pending' && (
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookingAction(booking.id, 'confirmed');
                          }}
                          className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                          title="Approve"
                        >
                          <CheckCircle className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookingAction(booking.id, 'rejected');
                          }}
                          className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                          title="Reject"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleCancelBooking(booking.id);
                          }}
                          className="p-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                          title="Cancel"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {/* Cancel button for owner on confirmed bookings */}
                    {isOwner && booking.status === 'confirmed' && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleCancelBooking(booking.id);
                        }}
                        className="ml-2 p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold"
                        title="Cancel Confirmed Booking"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCalendar;
