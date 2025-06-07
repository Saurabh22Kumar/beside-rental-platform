import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Get user's completed bookings that can be reviewed
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail parameter required' }, { status: 400 });
    }

    // Get completed bookings that don't have reviews yet
    const { data: reviewableBookings, error } = await supabase
      .rpc('get_reviewable_bookings', { user_email: userEmail });

    if (error) {
      console.error('Error fetching reviewable bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch reviewable bookings' }, { status: 500 });
    }

    return NextResponse.json({ 
      bookings: reviewableBookings || [],
      count: reviewableBookings?.length || 0
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/user/reviewable-bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
