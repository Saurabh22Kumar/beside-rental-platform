'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, Clock, User } from 'lucide-react';

interface BookingNotification {
  id: string;
  item_id: string;
  item_title: string;
  renter_email: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  total_days: number;
  created_at: string;
  status: string;
}

interface NotificationDropdownProps {
  ownerEmail: string;
  onBookingAction?: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  ownerEmail,
  onBookingAction
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (ownerEmail) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [ownerEmail]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?ownerEmail=${encodeURIComponent(ownerEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setPendingCount(data.pendingCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'confirmed' | 'rejected') => {
    try {
      setActionLoading(bookingId);
      
      // Find the booking to get item_id
      const booking = notifications.find(n => n.id === bookingId);
      if (!booking) return;

      const response = await fetch(`/api/items/${booking.item_id}/bookings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          status: action,
          ownerEmail
        })
      });

      if (response.ok) {
        // Remove the notification from the list
        setNotifications(prev => prev.filter(n => n.id !== bookingId));
        setPendingCount(prev => Math.max(0, prev - 1));
        
        // Call callback to refresh calendar if provided
        if (onBookingAction) {
          onBookingAction();
        }

        // Send notification to requester (you can implement email/push notification here)
        await sendNotificationToRequester(booking, action);
      }
    } catch (error) {
      console.error('Error updating booking:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const sendNotificationToRequester = async (booking: BookingNotification, action: 'confirmed' | 'rejected') => {
    // This would typically send an email or push notification
    // For now, we'll just log it
    
    // TODO: Implement actual notification sending
    // - Email notification
    // - In-app notification
    // - SMS notification (if phone number available)
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <Bell size={24} />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Booking Requests ({pendingCount})
            </h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No pending booking requests
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Item and Requester Info */}
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-blue-500" />
                        <h4 className="font-medium text-gray-900 truncate">
                          {notification.item_title}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {notification.renter_email}
                        </span>
                      </div>

                      {/* Booking Details */}
                      <div className="text-sm text-gray-600 mb-2">
                        <div>
                          {formatDate(notification.start_date)} - {formatDate(notification.end_date)}
                        </div>
                        <div>
                          {notification.total_days} day{notification.total_days > 1 ? 's' : ''} • ₹{notification.total_amount}
                        </div>
                      </div>

                      <div className="text-xs text-gray-400">
                        {getTimeAgo(notification.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleBookingAction(notification.id, 'confirmed')}
                      disabled={actionLoading === notification.id}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle size={14} />
                      Accept
                    </button>
                    <button
                      onClick={() => handleBookingAction(notification.id, 'rejected')}
                      disabled={actionLoading === notification.id}
                      className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationDropdown;
