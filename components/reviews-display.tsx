'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, Flag, User } from 'lucide-react';

interface Review {
  id: string;
  reviewer_email: string;
  rating: number;
  review_title?: string;
  review_text?: string;
  created_at: string;
  reviewer?: {
    name?: string;
    avatar?: string;
  };
}

interface ReviewsDisplayProps {
  itemId: string;
  currentUserEmail?: string;
}

export default function ReviewsDisplay({ itemId, currentUserEmail }: ReviewsDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating_high' | 'rating_low'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [helpfulnessVotes, setHelpfulnessVotes] = useState<Record<string, any>>({});

  const fetchReviews = async (pageNum = 1, resetList = false) => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        sort: sortBy,
        ...(filterBy !== 'all' && { rating: filterBy })
      });

      const response = await fetch(`/api/reviews/${itemId}?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews');
      }

      if (resetList || pageNum === 1) {
        setReviews(data.reviews || []);
      } else {
        setReviews(prev => [...prev, ...(data.reviews || [])]);
      }

      setHasMore(data.hasMore || false);
      
      // Fetch helpfulness data for all reviews
      data.reviews?.forEach((review: Review) => {
        fetchHelpfulness(review.id);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchHelpfulness = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/helpfulness?reviewId=${reviewId}`);
      const data = await response.json();
      
      if (response.ok) {
        setHelpfulnessVotes(prev => ({
          ...prev,
          [reviewId]: data
        }));
      }
    } catch (err) {
      console.error('Failed to fetch helpfulness data:', err);
    }
  };

  const handleHelpfulnessVote = async (reviewId: string, isHelpful: boolean) => {
    if (!currentUserEmail) {
      alert('Please log in to vote');
      return;
    }

    try {
      const response = await fetch('/api/reviews/helpfulness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          userEmail: currentUserEmail,
          isHelpful
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh helpfulness data
        fetchHelpfulness(reviewId);
      } else {
        alert(data.error || 'Failed to vote');
      }
    } catch (err) {
      alert('Failed to vote');
    }
  };

  const handleReportReview = async (reviewId: string) => {
    if (!currentUserEmail) {
      alert('Please log in to report reviews');
      return;
    }

    const reason = prompt('Why are you reporting this review? (spam, inappropriate, fake, offensive, other)');
    if (!reason) return;

    const description = prompt('Additional details (optional):') || '';

    try {
      const response = await fetch('/api/reviews/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          reporterEmail: currentUserEmail,
          reason: reason.toLowerCase(),
          description
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Review reported successfully. Thank you for helping keep our community safe.');
      } else {
        alert(data.error || 'Failed to report review');
      }
    } catch (err) {
      alert('Failed to report review');
    }
  };

  const renderStars = (rating: number, size = 'w-4 h-4') => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
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

  useEffect(() => {
    fetchReviews(1, true);
  }, [itemId, sortBy, filterBy]);

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => fetchReviews(1, true)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating_high">Highest Rated</option>
            <option value="rating_low">Lowest Rated</option>
          </select>

          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        <p className="text-gray-600">
          {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No reviews yet</p>
          <p className="text-gray-400 mt-2">Be the first to leave a review!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {review.reviewer?.avatar ? (
                      <img 
                        src={review.reviewer.avatar} 
                        alt={review.reviewer.name || 'Reviewer'} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {review.reviewer?.name || 'Anonymous User'}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {renderStars(review.rating)}
                  <span className="text-sm text-gray-600">({review.rating}/5)</span>
                </div>
              </div>

              {/* Review Content */}
              {review.review_title && (
                <h4 className="font-semibold text-gray-900 mb-2">{review.review_title}</h4>
              )}
              
              {review.review_text && (
                <p className="text-gray-700 mb-4 leading-relaxed">{review.review_text}</p>
              )}

              {/* Helpfulness and Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  {currentUserEmail && currentUserEmail !== review.reviewer_email && (
                    <>
                      <button
                        onClick={() => handleHelpfulnessVote(review.id, true)}
                        className="flex items-center space-x-1 text-sm text-gray-500 hover:text-green-600"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>Helpful</span>
                        {helpfulnessVotes[review.id]?.helpfulCount > 0 && (
                          <span className="text-green-600">({helpfulnessVotes[review.id].helpfulCount})</span>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleHelpfulnessVote(review.id, false)}
                        className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>Not Helpful</span>
                        {helpfulnessVotes[review.id]?.notHelpfulCount > 0 && (
                          <span className="text-red-600">({helpfulnessVotes[review.id].notHelpfulCount})</span>
                        )}
                      </button>
                    </>
                  )}
                  
                  {helpfulnessVotes[review.id]?.totalVotes > 0 && (
                    <span className="text-xs text-gray-400">
                      {helpfulnessVotes[review.id].helpfulPercentage}% found this helpful
                    </span>
                  )}
                </div>

                {currentUserEmail && currentUserEmail !== review.reviewer_email && (
                  <button
                    onClick={() => handleReportReview(review.id)}
                    className="flex items-center space-x-1 text-sm text-gray-400 hover:text-red-600"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Report</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              fetchReviews(nextPage, false);
            }}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More Reviews'}
          </button>
        </div>
      )}
    </div>
  );
}
