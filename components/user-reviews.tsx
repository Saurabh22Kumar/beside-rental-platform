'use client';

import { useState, useEffect } from 'react';
import { Star, Edit, Trash2, Clock, CheckCircle } from 'lucide-react';

interface UserReviewsProps {
  userEmail: string;
}

interface Review {
  id: string;
  item_id: string;
  booking_id: string;
  rating: number;
  review_title?: string;
  review_text?: string;
  created_at: string;
  updated_at: string;
  item?: {
    title: string;
    images?: string[];
  };
}

interface ReviewableBooking {
  booking_id: string;
  item_id: string;
  item_title: string;
  owner_email: string;
  end_date: string;
  total_amount: number;
}

export default function UserReviews({ userEmail }: UserReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewableBookings, setReviewableBookings] = useState<ReviewableBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-reviews' | 'pending-reviews'>('my-reviews');
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [updating, setUpdating] = useState(false);

  // Fetch user's reviews
  const fetchUserReviews = async () => {
    try {
      const response = await fetch(`/api/user/reviews?userEmail=${userEmail}`);
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to fetch user reviews:', err);
    }
  };

  // Fetch reviewable bookings
  const fetchReviewableBookings = async () => {
    try {
      const response = await fetch(`/api/user/reviewable-bookings?userEmail=${userEmail}`);
      const data = await response.json();

      if (response.ok) {
        setReviewableBookings(data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to fetch reviewable bookings:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUserReviews(),
        fetchReviewableBookings()
      ]);
      setLoading(false);
    };

    if (userEmail) {
      loadData();
    }
  }, [userEmail]);

  const startEdit = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditTitle(review.review_title || '');
    setEditText(review.review_text || '');
  };

  const cancelEdit = () => {
    setEditingReview(null);
    setEditRating(0);
    setEditTitle('');
    setEditText('');
  };

  const saveEdit = async () => {
    if (!editingReview) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/reviews/${editingReview.item_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId: editingReview.id,
          reviewerEmail: userEmail,
          rating: editRating,
          reviewTitle: editTitle.trim() || null,
          reviewText: editText.trim() || null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the review in the local state
        setReviews(prev => prev.map(review => 
          review.id === editingReview.id 
            ? { ...review, rating: editRating, review_title: editTitle, review_text: editText }
            : review
        ));
        cancelEdit();
      } else {
        alert(data.error || 'Failed to update review');
      }
    } catch (err) {
      alert('Failed to update review');
    } finally {
      setUpdating(false);
    }
  };

  const deleteReview = async (review: Review) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${review.item_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId: review.id,
          reviewerEmail: userEmail
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setReviews(prev => prev.filter(r => r.id !== review.id));
      } else {
        alert(data.error || 'Failed to delete review');
      }
    } catch (err) {
      alert('Failed to delete review');
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRatingChange?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-8 w-48 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('my-reviews')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-reviews'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('pending-reviews')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending-reviews'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Reviews ({reviewableBookings.length})
          </button>
        </nav>
      </div>

      {/* My Reviews Tab */}
      {activeTab === 'my-reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 text-lg mt-4">No reviews yet</p>
              <p className="text-gray-400 mt-2">Your reviews will appear here after you submit them.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6">
                {editingReview?.id === review.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        Edit Review for {review.item?.title || 'Item'}
                      </h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                      {renderStars(editRating, true, setEditRating)}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Review title..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-vertical"
                        placeholder="Share your experience..."
                      />
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={saveEdit}
                        disabled={updating || editRating === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updating ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {review.item?.title || 'Item'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Reviewed on {formatDate(review.created_at)}
                          {review.updated_at !== review.created_at && ' (edited)'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-600">({review.rating}/5)</span>
                      </div>
                    </div>

                    {review.review_title && (
                      <h4 className="font-medium text-gray-900 mb-2">{review.review_title}</h4>
                    )}

                    {review.review_text && (
                      <p className="text-gray-700 mb-4">{review.review_text}</p>
                    )}

                    <div className="flex space-x-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => startEdit(review)}
                        className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => deleteReview(review)}
                        className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending Reviews Tab */}
      {activeTab === 'pending-reviews' && (
        <div className="space-y-4">
          {reviewableBookings.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 text-lg mt-4">No pending reviews</p>
              <p className="text-gray-400 mt-2">Complete a rental to leave a review!</p>
            </div>
          ) : (
            reviewableBookings.map((booking) => (
              <div key={booking.booking_id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{booking.item_title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Rental completed on {formatDate(booking.end_date)}
                    </p>
                    <p className="text-sm text-gray-500">Amount: ₹{booking.total_amount}</p>
                  </div>
                  <div className="ml-4">
                    <a
                      href={`/items/${booking.item_id}#review`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Write Review
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
