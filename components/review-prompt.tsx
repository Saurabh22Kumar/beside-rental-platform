import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReviewSubmissionForm from './review-submission-form';

interface ReviewPromptProps {
  userEmail: string;
  onReviewSubmitted?: () => void;
}

interface ReviewableBooking {
  booking_id: string;
  booking: {
    id: string;
    item_id: string;
    start_date: string;
    end_date: string;
    item: {
      id: string;
      title: string;
      images: string[];
    };
  };
}

export default function ReviewPrompt({ userEmail, onReviewSubmitted }: ReviewPromptProps) {
  const [reviewableBookings, setReviewableBookings] = useState<ReviewableBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<ReviewableBooking | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviewableBookings();
  }, [userEmail]);

  const fetchReviewableBookings = async () => {
    if (!userEmail) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/user/reviewable-bookings?user_email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();

      if (response.ok) {
        setReviewableBookings(data.data || []);
      } else {
        console.error('Failed to fetch reviewable bookings:', data.error);
      }
    } catch (error) {
      console.error('Error fetching reviewable bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (booking: ReviewableBooking) => {
    setSelectedBooking(booking);
    setShowReviewForm(true);
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    setSelectedBooking(null);
    fetchReviewableBookings(); // Refresh the list
    if (onReviewSubmitted) {
      onReviewSubmitted();
    }
    toast({
      title: "Review submitted!",
      description: "Thank you for sharing your experience.",
    });
  };

  const getDaysAgo = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - end.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Rate Your Recent Rentals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reviewableBookings.length === 0) {
    return null; // Don't show anything if no reviewable bookings
  }

  if (showReviewForm && selectedBooking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Review Your Rental Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewSubmissionForm
            userEmail={userEmail}
            preSelectedBookingId={selectedBooking.booking_id}
            onSubmitted={handleReviewSubmitted}
            onCancel={() => {
              setShowReviewForm(false);
              setSelectedBooking(null);
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Rate Your Recent Rentals
          <Badge variant="secondary" className="ml-auto">
            {reviewableBookings.length} pending
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Help other users by sharing your rental experience
          </p>
          
          {reviewableBookings.slice(0, 3).map((booking) => (
            <div
              key={booking.booking_id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-muted">
                  {booking.booking.item.images && booking.booking.item.images.length > 0 ? (
                    <img
                      src={booking.booking.item.images[0]}
                      alt={booking.booking.item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Star className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium">{booking.booking.item.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Returned {getDaysAgo(booking.booking.end_date)} days ago</span>
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Completed</span>
                  </div>
                </div>
              </div>
              
              <Button
                size="sm"
                onClick={() => handleReviewClick(booking)}
                className="flex items-center gap-2"
              >
                <Star className="h-4 w-4" />
                Write Review
              </Button>
            </div>
          ))}
          
          {reviewableBookings.length > 3 && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // This could navigate to a dedicated reviews page
                  console.log('Show all reviewable bookings');
                }}
              >
                View All ({reviewableBookings.length - 3} more)
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
