'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, Package, MapPin, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import ReviewPrompt from '@/components/review-prompt';

interface BookingHistoryItem {
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
  items: {
    id: string;
    title: string;
    images: string[];
    category: string;
    price: number;
    owner_email: string;
  };
}

interface BookingHistoryData {
  userBookings: BookingHistoryItem[];
  ownerBookings: BookingHistoryItem[];
}

const BookingHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [bookingHistory, setBookingHistory] = useState<BookingHistoryData>({
    userBookings: [],
    ownerBookings: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rented' | 'owned'>('rented');

  useEffect(() => {
    if (user?.email) {
      fetchBookingHistory();
    }
  }, [user]);

  const fetchBookingHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bookings/history?userEmail=${encodeURIComponent(user?.email || '')}`);
      
      if (response.ok) {
        const data = await response.json();
        setBookingHistory(data);
      } else {
        console.error('Failed to fetch booking history');
      }
    } catch (error) {
      console.error('Error fetching booking history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      confirmed: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      cancelled: 'bg-gray-100 text-gray-700 border-gray-200'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.cancelled}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return start === end ? start : `${start} - ${end}`;
  };

  const BookingCard: React.FC<{ booking: BookingHistoryItem; isOwner: boolean }> = ({ booking, isOwner }) => {
    const imageUrl = booking.items.images && booking.items.images.length > 0 
      ? booking.items.images[0] 
      : '/placeholder.svg?height=100&width=100';

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Item Image */}
            <div className="flex-shrink-0">
              <img
                src={imageUrl}
                alt={booking.items.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
            </div>

            {/* Booking Details */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Link 
                    href={`/items/${booking.items.id}`}
                    className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                  >
                    {booking.items.title}
                  </Link>
                  <p className="text-sm text-gray-600">{booking.items.category}</p>
                </div>
                {getStatusBadge(booking.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDateRange(booking.start_date, booking.end_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{booking.total_days} day{booking.total_days > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span>₹{booking.total_amount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>
                    {isOwner ? `Rented by: ${booking.renter_email}` : `Owner: ${booking.owner_email}`}
                  </span>
                </div>
              </div>

              {booking.notes && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <span className="font-medium">Notes:</span> {booking.notes}
                </div>
              )}

              <div className="mt-2 text-xs text-gray-500">
                Booked on: {formatDate(booking.created_at)}
                {booking.updated_at !== booking.created_at && (
                  <span> • Updated: {formatDate(booking.updated_at)}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to view your booking history.</p>
            <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Sign In
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Booking History</h1>

        {/* Review Prompt for completed bookings */}
        {user?.email && (
          <div className="mb-6">
            <ReviewPrompt 
              userEmail={user.email} 
              onReviewSubmitted={() => {
                // Optionally refresh booking history to update status
                fetchBookingHistory();
              }}
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab('rented')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'rented'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Items I Rented ({bookingHistory.userBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('owned')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'owned'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            My Items Rented ({bookingHistory.ownerBookings.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'rented' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Items You've Rented</h2>
            {bookingHistory.userBookings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Rental History</h3>
                  <p className="text-gray-500 mb-4">You haven't rented any items yet.</p>
                  <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Browse Items
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div>
                {bookingHistory.userBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} isOwner={false} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'owned' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Items Rented by Others</h2>
            {bookingHistory.ownerBookings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Rental Activity</h3>
                  <p className="text-gray-500 mb-4">No one has rented your items yet.</p>
                  <Link href="/my-items" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Manage My Items
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div>
                {bookingHistory.ownerBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} isOwner={true} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {bookingHistory.userBookings.length}
                </div>
                <div className="text-sm text-gray-600">Items Rented</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {bookingHistory.ownerBookings.length}
                </div>
                <div className="text-sm text-gray-600">Items Lent</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  ₹{bookingHistory.userBookings
                    .filter(booking => booking.status !== 'cancelled')
                    .reduce((sum, booking) => sum + booking.total_amount, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  ₹{bookingHistory.ownerBookings
                    .filter(booking => booking.status !== 'cancelled')
                    .reduce((sum, booking) => sum + booking.total_amount, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Earned</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingHistoryPage;
