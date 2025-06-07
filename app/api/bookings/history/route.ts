import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch user's complete booking history
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }


    // Fetch bookings where user is the renter (products they booked from others)
    const { data: userBookings, error: userBookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        items (
          id,
          title,
          images,
          category,
          price,
          owner_email
        )
      `)
      .eq('renter_email', userEmail)
      .order('created_at', { ascending: false });

    if (userBookingsError) {
      console.error('Error fetching user bookings:', userBookingsError);
      return NextResponse.json({ error: 'Failed to fetch user bookings' }, { status: 500 });
    }

    // Fetch bookings where user is the owner (their products booked by others)
    const { data: ownerBookings, error: ownerBookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        items (
          id,
          title,
          images,
          category,
          price,
          owner_email
        )
      `)
      .eq('owner_email', userEmail)
      .order('created_at', { ascending: false });

    if (ownerBookingsError) {
      console.error('Error fetching owner bookings:', ownerBookingsError);
      return NextResponse.json({ error: 'Failed to fetch owner bookings' }, { status: 500 });
    }

    return NextResponse.json({
      userBookings: userBookings || [],
      ownerBookings: ownerBookings || []
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
