'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface RatingSummaryProps {
  itemId: string;
  averageRating?: number;
  totalReviews?: number;
}

interface RatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export default function RatingSummary({ 
  itemId, 
  averageRating: propAverageRating, 
  totalReviews: propTotalReviews 
}: RatingSummaryProps) {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatingStats = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/reviews/${itemId}?statsOnly=true`);
        const data = await response.json();

        if (response.ok) {
          setStats(data.stats);
        } else {
          // Fallback to props if API fails
          if (propAverageRating !== undefined && propTotalReviews !== undefined) {
            setStats({
              averageRating: propAverageRating,
              totalReviews: propTotalReviews,
              ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch rating stats:', err);
        // Fallback to props
        if (propAverageRating !== undefined && propTotalReviews !== undefined) {
          setStats({
            averageRating: propAverageRating,
            totalReviews: propTotalReviews,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRatingStats();
  }, [itemId, propAverageRating, propTotalReviews]);

  const renderStars = (rating: number, size = 'w-5 h-5') => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= Math.floor(rating) 
                ? 'text-yellow-400 fill-current' 
                : star <= rating 
                ? 'text-yellow-400 fill-current opacity-50'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Fair';
    if (rating >= 2.0) return 'Poor';
    return 'Very Poor';
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 h-8 w-32 rounded mb-2"></div>
        <div className="bg-gray-200 h-4 w-24 rounded"></div>
      </div>
    );
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        {renderStars(0)}
        <span className="text-sm">No reviews yet</span>
      </div>
    );
  }

  const { averageRating, totalReviews, ratingDistribution } = stats;

  return (
    <div className="space-y-4">
      {/* Overall Rating */}
      <div className="flex items-center space-x-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex justify-center mb-1">
            {renderStars(averageRating)}
          </div>
          <div className="text-sm text-gray-600">
            {getRatingText(averageRating)}
          </div>
        </div>
        
        <div className="flex-1">
          <p className="text-lg font-medium text-gray-900">
            {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </p>
          <p className="text-sm text-gray-600">
            Based on verified rentals
          </p>
        </div>
      </div>

      {/* Rating Distribution */}
      {totalReviews > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Rating breakdown</h4>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating as keyof typeof ratingDistribution] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center space-x-2 text-sm">
                <span className="w-8 text-gray-600">{rating}</span>
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="w-8 text-gray-600 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
