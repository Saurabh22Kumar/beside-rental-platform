import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/bookings - Get all bookings (or filtered by user)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail');
    const itemId = searchParams.get('itemId');

    let query = supabase
      .from('bookings')
      .select(`
        *,
        items (
          title,
          images,
          category
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by user email if provided
    if (userEmail) {
      query = query.or(`renter_email.eq.${userEmail},owner_email.eq.${userEmail}`);
    }

    // Filter by item ID if provided
    if (itemId) {
      query = query.eq('item_id', itemId);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    return NextResponse.json({ bookings: bookings || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/bookings - Create a new booking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      item_id,
      renter_email,
      owner_email,
      start_date,
      end_date,
      total_days,
      total_amount
    } = body;

    // Validate required fields
    if (!item_id || !renter_email || !owner_email || !start_date || !end_date || !total_days || !total_amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        item_id,
        renter_email,
        owner_email,
        start_date,
        end_date,
        total_days,
        total_amount,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    // Update item's booked dates
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('booked_dates')
      .eq('id', item_id)
      .single();

    if (!itemError && item) {
      const currentBookedDates = item.booked_dates || [];
      const newBookedDates = generateDateRange(start_date, end_date);
      const updatedBookedDates = [...currentBookedDates, ...newBookedDates];

      await supabase
        .from('items')
        .update({ booked_dates: updatedBookedDates })
        .eq('id', item_id);
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to generate date range
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}