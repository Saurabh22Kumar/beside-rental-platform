import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch reviews for an item
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sort') || 'newest';
    const rating = searchParams.get('rating');
    const statsOnly = searchParams.get('statsOnly') === 'true';
    const offset = (page - 1) * limit;

    // If only stats are requested
    if (statsOnly) {
      const { data: statsData, error: statsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('item_id', id);

      if (statsError) {
        console.error('Error fetching review stats:', statsError);
        return NextResponse.json({ error: 'Failed to fetch review statistics' }, { status: 500 });
      }

      const reviews = statsData || [];
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      });

      return NextResponse.json({
        stats: {
          averageRating: Math.round(averageRating * 100) / 100,
          totalReviews,
          ratingDistribution
        }
      });
    }

    // Build query with filters
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('item_id', id);

    // Apply rating filter if specified
    if (rating && rating !== 'all') {
      query = query.eq('rating', parseInt(rating));
    }

    // Determine sort order
    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'rating_high':
        query = query.order('rating', { ascending: false });
        break;
      case 'rating_low':
        query = query.order('rating', { ascending: true });
        break;
      default: // newest
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: reviews, error: reviewsError } = await query;

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // Calculate total count for pagination
    const { count, error: countError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', id);

    if (countError) {
      console.error('Error counting reviews:', countError);
      return NextResponse.json({ error: 'Failed to count reviews' }, { status: 500 });
    }

    // Calculate rating statistics
    const { data: ratingStats, error: statsError } = await supabase
      .rpc('get_rating_distribution', { item_uuid: id });

    if (statsError) {
    }

    // Process reviews to include helpful vote counts and reviewer info
    const processedReviews = reviews?.map(review => ({
      ...review,
      helpful_votes: review.helpfulness_votes?.filter((vote: any) => vote.is_helpful).length || 0,
      total_votes: review.helpfulness_votes?.length || 0,
      reviewer: {
        name: review.reviewer_email?.split('@')[0] || 'Anonymous',
        avatar: null
      }
    })) || [];

    return NextResponse.json({
      reviews: processedReviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalReviews: count || 0,
        hasNextPage: offset + limit < (count || 0),
        hasPreviousPage: page > 1
      },
      averageRating: processedReviews.length > 0 
        ? processedReviews.reduce((sum, review) => sum + review.rating, 0) / processedReviews.length 
        : 0,
      ratingDistribution: ratingStats || null
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/reviews/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new review (only for users with completed bookings)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      bookingId, 
      reviewerEmail, 
      rating, 
      reviewTitle, 
      reviewText 
    } = body;

    // Validate required fields
    if (!bookingId || !reviewerEmail || !rating) {
      return NextResponse.json({ 
        error: 'Missing required fields: bookingId, reviewerEmail, rating' 
      }, { status: 400 });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 5' 
      }, { status: 400 });
    }

    // Check if the booking exists and is completed
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('item_id', id)
      .eq('renter_email', reviewerEmail)
      .eq('status', 'completed')
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ 
        error: 'Only users with completed bookings can submit reviews' 
      }, { status: 403 });
    }

    // Check if review already exists for this booking
    const { data: existingReview, error: existingError } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .single();

    if (existingReview) {
      return NextResponse.json({ 
        error: 'Review already exists for this booking' 
      }, { status: 409 });
    }

    // Create the review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        item_id: id,
        booking_id: bookingId,
        reviewer_email: reviewerEmail,
        owner_email: booking.owner_email,
        rating,
        review_title: reviewTitle?.trim() || null,
        review_text: reviewText?.trim() || null
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }

    // Fetch the created review with user details
    const { data: reviewWithDetails, error: detailsError } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_email(name, avatar)
      `)
      .eq('id', review.id)
      .single();

    if (detailsError) {
    }

    return NextResponse.json({ 
      review: reviewWithDetails || review,
      message: 'Review created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/reviews/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a review (only by the reviewer)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      reviewId,
      reviewerEmail, 
      rating, 
      reviewTitle, 
      reviewText 
    } = body;

    // Validate required fields
    if (!reviewId || !reviewerEmail) {
      return NextResponse.json({ 
        error: 'Missing required fields: reviewId, reviewerEmail' 
      }, { status: 400 });
    }

    // Validate rating range if provided
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 5' 
      }, { status: 400 });
    }

    // Check if the review exists and belongs to the user
    const { data: existingReview, error: existingError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .eq('item_id', id)
      .eq('reviewer_email', reviewerEmail)
      .single();

    if (existingError || !existingReview) {
      return NextResponse.json({ 
        error: 'Review not found or you do not have permission to edit it' 
      }, { status: 404 });
    }

    // Update the review
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (rating) updateData.rating = rating;
    if (reviewTitle !== undefined) updateData.review_title = reviewTitle?.trim() || null;
    if (reviewText !== undefined) updateData.review_text = reviewText?.trim() || null;

    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating review:', updateError);
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }

    return NextResponse.json({ 
      review: updatedReview,
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/reviews/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a review (only by the reviewer)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    const reviewerEmail = searchParams.get('reviewerEmail');

    if (!reviewId || !reviewerEmail) {
      return NextResponse.json({ 
        error: 'Missing required parameters: reviewId, reviewerEmail' 
      }, { status: 400 });
    }

    // Check if the review exists and belongs to the user
    const { data: existingReview, error: existingError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .eq('item_id', id)
      .eq('reviewer_email', reviewerEmail)
      .single();

    if (existingError || !existingReview) {
      return NextResponse.json({ 
        error: 'Review not found or you do not have permission to delete it' 
      }, { status: 404 });
    }

    // Delete the review
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (deleteError) {
      console.error('Error deleting review:', deleteError);
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/reviews/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
