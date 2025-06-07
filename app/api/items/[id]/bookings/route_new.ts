import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper function to generate date range
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// GET - Fetch bookings and unavailable dates for an item
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    console.log('GET bookings for item:', id);

    // Fetch bookings from database
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('item_id', id)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Fetch item data to get booked_dates array
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('booked_dates')
      .eq('id', id)
      .single();

    if (itemError) {
      console.error('Error fetching item:', itemError);
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Transform booked_dates array to unavailable dates format
    const bookedDates = item?.booked_dates || [];
    const unavailableDates = bookedDates.map((date: string, index: number) => ({
      id: `${id}-${date}-${index}`,
      item_id: id,
      unavailable_date: date,
      reason: 'Owner unavailable or booked',
      created_at: new Date().toISOString()
    }));

    return NextResponse.json({
      bookings: bookings || [],
      unavailableDates: unavailableDates
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new booking request
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const { userEmail, ownerEmail, startDate, endDate } = body;

    console.log('POST booking request:', { id, userEmail, ownerEmail, startDate, endDate });

    // Validate required fields
    if (!userEmail || !ownerEmail || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if item exists
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('booked_dates, price')
      .eq('id', id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Generate date range for the booking
    const requestedDates = generateDateRange(startDate, endDate);
    const bookedDates = item.booked_dates || [];

    // Check if any requested dates are already booked
    const conflictDates = requestedDates.filter(date => bookedDates.includes(date));
    if (conflictDates.length > 0) {
      return NextResponse.json({ 
        error: 'Some dates are not available',
        conflictDates: conflictDates
      }, { status: 400 });
    }

    // Calculate total days and amount
    const totalDays = requestedDates.length;
    const totalAmount = totalDays * (item.price || 0);

    // Create booking in database
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        item_id: id,
        renter_email: userEmail,
        owner_email: ownerEmail,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        total_amount: totalAmount,
        status: 'pending'
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update booking status (approve/reject)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const { bookingId, status, ownerEmail } = body;

    console.log('PUT booking status update:', { id, bookingId, status, ownerEmail });

    // Validate required fields
    if (!bookingId || !status || !ownerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate status
    if (!['confirmed', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the booking to verify ownership
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('item_id', id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify ownership
    if (booking.owner_email !== ownerEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update booking status
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // If confirmed, add dates to item's booked_dates array
    if (status === 'confirmed') {
      const { data: item, error: itemError } = await supabase
        .from('items')
        .select('booked_dates')
        .eq('id', id)
        .single();

      if (!itemError && item) {
        const currentBookedDates = item.booked_dates || [];
        const newBookedDates = generateDateRange(booking.start_date, booking.end_date);
        const updatedBookedDates = [...new Set([...currentBookedDates, ...newBookedDates])];

        await supabase
          .from('items')
          .update({ booked_dates: updatedBookedDates })
          .eq('id', id);
      }
    }

    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
