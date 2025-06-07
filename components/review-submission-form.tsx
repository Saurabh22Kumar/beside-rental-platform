'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface ReviewSubmissionFormProps {
  itemId?: string;
  userEmail: string;
  preSelectedBookingId?: string;
  onReviewSubmitted?: () => void;
  onSubmitted?: () => void;
  onCancel?: () => void;
}

interface ReviewableBooking {
  booking_id: string;
  item_id: string;
  item_title: string;
  owner_email: string;
  end_date: string;
  total_amount: number;
}

export default function ReviewSubmissionForm({ 
  itemId, 
  userEmail, 
  preSelectedBookingId,
  onReviewSubmitted,
  onSubmitted,
  onCancel
}: ReviewSubmissionFormProps) {
  const [reviewableBookings, setReviewableBookings] = useState<ReviewableBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch user's reviewable bookings
  useEffect(() => {
    const fetchReviewableBookings = async () => {
      try {
        const response = await fetch(`/api/user/reviewable-bookings?userEmail=${userEmail}`);
        const data = await response.json();

        if (response.ok) {
          // Filter bookings for the current item
          const itemBookings = data.bookings.filter(
            (booking: ReviewableBooking) => booking.item_id === itemId
          );
          setReviewableBookings(itemBookings);
          
          // Auto-select if only one booking
          if (itemBookings.length === 1) {
            setSelectedBooking(itemBookings[0].booking_id);
          }
        } else {
          setError(data.error || 'Failed to fetch reviewable bookings');
        }
      } catch (err) {
        setError('Failed to fetch reviewable bookings');
      }
    };

    if (userEmail && itemId) {
      fetchReviewableBookings();
    }
  }, [userEmail, itemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBooking) {
      setError('Please select a booking to review');
      return;
    }
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/reviews/${itemId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: selectedBooking,
          reviewerEmail: userEmail,
          rating,
          reviewTitle: reviewTitle.trim() || null,
          reviewText: reviewText.trim() || null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Reset form
        setRating(0);
        setReviewTitle('');
        setReviewText('');
        setSelectedBooking('');
        
        // Remove the reviewed booking from the list
        setReviewableBookings(prev => 
          prev.filter(booking => booking.booking_id !== selectedBooking)
        );

        // Notify parent component
        onReviewSubmitted?.();
      } else {
        setError(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (currentRating: number, interactive = false) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`w-8 h-8 ${
                star <= (interactive ? (hoverRating || currentRating) : currentRating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  if (reviewableBookings.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">
          You can only review items you have rented and completed.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Complete a rental to leave a review!
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-green-900 mb-1">Review Submitted!</h3>
        <p className="text-green-700">
          Thank you for sharing your experience. Your review helps other users make informed decisions.
        </p>
        {reviewableBookings.length > 0 && (
          <button
            onClick={() => setSuccess(false)}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Leave Another Review
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Leave a Review</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Booking Selection */}
        {reviewableBookings.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select your rental experience
            </label>
            <select
              value={selectedBooking}
              onChange={(e) => setSelectedBooking(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Choose a booking...</option>
              {reviewableBookings.map((booking) => (
                <option key={booking.booking_id} value={booking.booking_id}>
                  Rental ended {new Date(booking.end_date).toLocaleDateString()} - ₹{booking.total_amount}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <div className="flex items-center space-x-4">
            {renderStars(rating, true)}
            {rating > 0 && (
              <span className="text-lg font-medium text-gray-700">
                {rating}/5 - {getRatingLabel(rating)}
              </span>
            )}
          </div>
        </div>

        {/* Review Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Title (optional)
          </label>
          <input
            type="text"
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            placeholder="Summarize your experience..."
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">{reviewTitle.length}/200 characters</p>
        </div>

        {/* Review Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review (optional)
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share details of your experience..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
          />
          <p className="text-xs text-gray-500 mt-1">
            Help others by sharing specific details about your rental experience.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
