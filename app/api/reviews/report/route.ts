import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Report a review for inappropriate content
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reviewId, reporterEmail, reason, description } = body;

    // Validate required fields
    if (!reviewId || !reporterEmail || !reason) {
      return NextResponse.json({ 
        error: 'Missing required fields: reviewId, reporterEmail, reason' 
      }, { status: 400 });
    }

    // Validate reason
    const validReasons = ['spam', 'inappropriate', 'fake', 'offensive', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ 
        error: 'Invalid reason. Must be one of: ' + validReasons.join(', ') 
      }, { status: 400 });
    }

    // Check if review exists
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, reviewer_email')
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Prevent self-reporting
    if (review.reviewer_email === reporterEmail) {
      return NextResponse.json({ 
        error: 'You cannot report your own review' 
      }, { status: 400 });
    }

    // Check if user has already reported this review
    const { data: existingReport, error: existingError } = await supabase
      .from('review_reports')
      .select('id')
      .eq('review_id', reviewId)
      .eq('reporter_email', reporterEmail)
      .single();

    if (existingReport) {
      return NextResponse.json({ 
        error: 'You have already reported this review' 
      }, { status: 409 });
    }

    // Create the report
    const { data: report, error: reportError } = await supabase
      .from('review_reports')
      .insert({
        review_id: reviewId,
        reporter_email: reporterEmail,
        reason,
        description: description?.trim() || null
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error creating review report:', reportError);
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }

    return NextResponse.json({ 
      report, 
      message: 'Review reported successfully. Our team will review it shortly.' 
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/reviews/report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get reports for a review (admin only)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get('reviewId');
    const adminEmail = searchParams.get('adminEmail');

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId parameter required' }, { status: 400 });
    }

    // Basic admin check (you might want to implement proper admin role checking)
    if (!adminEmail || !adminEmail.includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get reports for the review
    const { data: reports, error } = await supabase
      .from('review_reports')
      .select(`
        *,
        reporter:profiles!reporter_email(name, email)
      `)
      .eq('review_id', reviewId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching review reports:', error);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    return NextResponse.json({ 
      reports: reports || [],
      count: reports?.length || 0
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/reviews/report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
