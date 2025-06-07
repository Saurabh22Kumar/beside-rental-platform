import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Vote on review helpfulness (helpful/not helpful)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reviewId, userEmail, isHelpful } = body;

    // Validate required fields
    if (!reviewId || !userEmail || typeof isHelpful !== 'boolean') {
      return NextResponse.json({ 
        error: 'Missing required fields: reviewId, userEmail, isHelpful' 
      }, { status: 400 });
    }

    // Check if review exists
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id')
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check if user has already voted on this review
    const { data: existingVote, error: existingError } = await supabase
      .from('review_helpfulness')
      .select('id, is_helpful')
      .eq('review_id', reviewId)
      .eq('user_email', userEmail)
      .single();

    if (existingVote) {
      // Update existing vote if different
      if (existingVote.is_helpful !== isHelpful) {
        const { data: updatedVote, error: updateError } = await supabase
          .from('review_helpfulness')
          .update({ is_helpful: isHelpful })
          .eq('id', existingVote.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating helpfulness vote:', updateError);
          return NextResponse.json({ error: 'Failed to update vote' }, { status: 500 });
        }

        return NextResponse.json({ 
          vote: updatedVote, 
          message: 'Vote updated successfully' 
        });
      } else {
        return NextResponse.json({ 
          vote: existingVote, 
          message: 'Vote already exists with same value' 
        });
      }
    }

    // Create new vote
    const { data: newVote, error: voteError } = await supabase
      .from('review_helpfulness')
      .insert({
        review_id: reviewId,
        user_email: userEmail,
        is_helpful: isHelpful
      })
      .select()
      .single();

    if (voteError) {
      console.error('Error creating helpfulness vote:', voteError);
      return NextResponse.json({ error: 'Failed to create vote' }, { status: 500 });
    }

    return NextResponse.json({ 
      vote: newVote, 
      message: 'Vote created successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/reviews/helpfulness:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get helpfulness stats for a review
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId parameter required' }, { status: 400 });
    }

    // Get helpfulness counts
    const { data: helpfulnessData, error } = await supabase
      .from('review_helpfulness')
      .select('is_helpful')
      .eq('review_id', reviewId);

    if (error) {
      console.error('Error fetching helpfulness data:', error);
      return NextResponse.json({ error: 'Failed to fetch helpfulness data' }, { status: 500 });
    }

    const helpfulCount = helpfulnessData?.filter(vote => vote.is_helpful).length || 0;
    const notHelpfulCount = helpfulnessData?.filter(vote => !vote.is_helpful).length || 0;
    const totalVotes = helpfulCount + notHelpfulCount;

    return NextResponse.json({
      reviewId,
      helpfulCount,
      notHelpfulCount,
      totalVotes,
      helpfulPercentage: totalVotes > 0 ? Math.round((helpfulCount / totalVotes) * 100) : 0
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/reviews/helpfulness:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
