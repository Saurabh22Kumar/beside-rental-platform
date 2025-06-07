import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('user_email');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status'); // 'all', 'pending', 'submitted'

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Base query for user's reviews
    let reviewsQuery = supabase
      .from('reviews')
      .select(`
        *,
        booking:bookings!inner(
          id,
          item_id,
          start_date,
          end_date,
          status,
          item:items!inner(
            id,
            title,
            images
          )
        )
      `)
      .eq('booking.renter_email', userEmail)
      .order('created_at', { ascending: false });

    // Apply filters based on status
    if (status === 'pending') {
      // Get completed bookings without reviews
      const { data: completedBookings } = await supabase
        .from('bookings')
        .select(`
          id,
          item_id,
          start_date,
          end_date,
          status,
          item:items!inner(
            id,
            title,
            images
          )
        `)
        .eq('renter_email', userEmail)
        .eq('status', 'completed');

      if (completedBookings) {
        // Get existing review booking IDs
        const { data: existingReviews } = await supabase
          .from('reviews')
          .select('booking_id')
          .in('booking_id', completedBookings.map(b => b.id));

        const reviewedBookingIds = existingReviews?.map(r => r.booking_id) || [];
        
        // Filter out bookings that already have reviews
        const pendingBookings = completedBookings
          .filter(booking => !reviewedBookingIds.includes(booking.id))
          .slice(offset, offset + limit)
          .map(booking => ({
            booking_id: booking.id,
            booking: booking,
            status: 'pending'
          }));

        return NextResponse.json({
          data: pendingBookings,
          count: completedBookings.filter(booking => !reviewedBookingIds.includes(booking.id)).length,
          total_pages: Math.ceil(completedBookings.filter(booking => !reviewedBookingIds.includes(booking.id)).length / limit)
        });
      }

      return NextResponse.json({
        data: [],
        count: 0,
        total_pages: 0
      });
    } else if (status === 'submitted') {
      // Only get reviews that have been submitted
      reviewsQuery = reviewsQuery.not('rating', 'is', null);
    }

    // Apply pagination
    reviewsQuery = reviewsQuery.range(offset, offset + limit - 1);

    const { data: reviews, error, count } = await reviewsQuery;

    if (error) {
      console.error('Error fetching user reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('booking.renter_email', userEmail);

    return NextResponse.json({
      data: reviews || [],
      count: reviews?.length || 0,
      total_count: totalCount || 0,
      total_pages: Math.ceil((totalCount || 0) / limit),
      current_page: Math.floor(offset / limit) + 1
    });

  } catch (error) {
    console.error('Error in user reviews API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('review_id');
    const body = await request.json();
    const { rating, review_text, pros, cons, user_email } = body;

    if (!reviewId || !user_email) {
      return NextResponse.json(
        { error: 'Review ID and user email are required' },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify user owns this review
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select(`
        *,
        booking:bookings!inner(renter_email)
      `)
      .eq('id', reviewId)
      .eq('booking.renter_email', user_email)
      .single();

    if (fetchError || !existingReview) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update the review
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        rating,
        review_text,
        pros,
        cons,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select(`
        *,
        booking:bookings!inner(
          id,
          item_id,
          item:items!inner(
            id,
            title,
            images
          )
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating review:', updateError);
      return NextResponse.json(
        { error: 'Failed to update review' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Review updated successfully',
      data: updatedReview
    });

  } catch (error) {
    console.error('Error updating user review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('review_id');
    const userEmail = searchParams.get('user_email');

    if (!reviewId || !userEmail) {
      return NextResponse.json(
        { error: 'Review ID and user email are required' },
        { status: 400 }
      );
    }

    // Verify user owns this review
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select(`
        *,
        booking:bookings!inner(renter_email)
      `)
      .eq('id', reviewId)
      .eq('booking.renter_email', userEmail)
      .single();

    if (fetchError || !existingReview) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the review
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (deleteError) {
      console.error('Error deleting review:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete review' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
