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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');
    const ownerEmail = url.searchParams.get('ownerEmail');
    

    // Fetch all bookings (simplified without phone join for now)
    const { data: allBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('item_id', id)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Filter bookings based on user permissions:
    // 1. If user is the owner, show all bookings for this item
    // 2. If user is not the owner, only show their own bookings and confirmed bookings
    // 3. If no userEmail provided, show only confirmed bookings (for anonymous users)
    let filteredBookings = allBookings || [];
    
    if (userEmail) {
      if (userEmail === ownerEmail) {
        // Owner can see all bookings for their item
        filteredBookings = allBookings || [];
      } else {
        // Regular users can see:
        // - Their own bookings (any status)
        // - Confirmed bookings from others (for calendar blocking)
        filteredBookings = (allBookings || []).filter(booking => 
          booking.renter_email === userEmail || booking.status === 'confirmed'
        );
      }
    } else {
      // Anonymous users can only see confirmed bookings (for calendar display)
      filteredBookings = (allBookings || []).filter(booking => 
        booking.status === 'confirmed'
      );
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
      bookings: filteredBookings,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userEmail, ownerEmail, startDate, endDate } = body;


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

    // Check if any requested dates are already confirmed (only confirmed bookings block new requests)
    const { data: confirmedBookings, error: confirmedError } = await supabase
      .from('bookings')
      .select('start_date, end_date')
      .eq('item_id', id)
      .eq('status', 'confirmed');

    if (confirmedError) {
      console.error('Error checking confirmed bookings:', confirmedError);
      return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
    }

    // Check if any requested dates conflict with confirmed bookings
    const conflictDates = [];
    for (const date of requestedDates) {
      // Check against owner-blocked dates
      if (bookedDates.includes(date)) {
        conflictDates.push(date);
        continue;
      }

      // Check against confirmed bookings
      const hasConfirmedBooking = confirmedBookings?.some(booking => {
        const bookingDates = generateDateRange(booking.start_date, booking.end_date);
        return bookingDates.includes(date);
      });

      if (hasConfirmedBooking) {
        conflictDates.push(date);
      }
    }

    if (conflictDates.length > 0) {
      return NextResponse.json({ 
        error: 'Some dates are already confirmed or blocked',
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

// PUT - Update booking status (approve/reject/cancel)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { bookingId, status, ownerEmail, userEmail } = body;


    // Validate required fields
    if (!bookingId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate status
    if (!['confirmed', 'rejected', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the booking to verify permissions
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('item_id', id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get item details for notifications
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('title, booked_dates')
      .eq('id', id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Verify permissions
    if (status === 'cancelled') {
      // Only the requester or the owner can cancel bookings
      const isRequester = booking.renter_email === userEmail;
      const isOwner = booking.owner_email === ownerEmail;
      if (!isRequester && !isOwner) {
        return NextResponse.json({ error: 'Unauthorized to cancel this booking' }, { status: 403 });
      }
      // Allow cancellation of both pending and confirmed bookings
      if (!['pending', 'confirmed'].includes(booking.status)) {
        return NextResponse.json({ error: 'Only pending or confirmed bookings can be cancelled' }, { status: 400 });
      }
    } else {
      // Only the owner can approve/reject
      if (booking.owner_email !== ownerEmail) {
        return NextResponse.json({ error: 'Only the owner can approve or reject bookings' }, { status: 403 });
      }
      if (booking.status !== 'pending') {
        return NextResponse.json({ error: 'Only pending bookings can be approved or rejected' }, { status: 400 });
      }
    }

    // If confirming, check if dates are still available (in case another booking was confirmed)
    if (status === 'confirmed') {
      const requestedDates = generateDateRange(booking.start_date, booking.end_date);
      const currentBookedDates = item.booked_dates || [];
      
      // Check for confirmed bookings in the same date range
      const { data: confirmedBookings, error: confirmedError } = await supabase
        .from('bookings')
        .select('start_date, end_date')
        .eq('item_id', id)
        .eq('status', 'confirmed')
        .neq('id', bookingId); // Exclude current booking

      if (!confirmedError && confirmedBookings) {
        const conflictDates = [];
        for (const date of requestedDates) {
          // Check against owner-blocked dates
          if (currentBookedDates.includes(date)) {
            conflictDates.push(date);
            continue;
          }

          // Check against other confirmed bookings
          const hasConfirmedBooking = confirmedBookings.some(otherBooking => {
            const otherBookingDates = generateDateRange(otherBooking.start_date, otherBooking.end_date);
            return otherBookingDates.includes(date);
          });

          if (hasConfirmedBooking) {
            conflictDates.push(date);
          }
        }

        if (conflictDates.length > 0) {
          return NextResponse.json({ 
            error: 'Some dates are no longer available',
            conflictDates: conflictDates
          }, { status: 400 });
        }
      }
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
      const currentBookedDates = item.booked_dates || [];
      const newBookedDates = generateDateRange(booking.start_date, booking.end_date);
      const updatedBookedDates = [...new Set([...currentBookedDates, ...newBookedDates])];

      await supabase
        .from('items')
        .update({ booked_dates: updatedBookedDates })
        .eq('id', id);
    }

    // If cancelling a confirmed booking, remove dates from item's booked_dates array
    if (status === 'cancelled' && booking.status === 'confirmed') {
      const currentBookedDates = item.booked_dates || [];
      const datesToRemove = generateDateRange(booking.start_date, booking.end_date);
      const updatedBookedDates = currentBookedDates.filter((date: string) => !datesToRemove.includes(date));

      await supabase
        .from('items')
        .update({ booked_dates: updatedBookedDates })
        .eq('id', id);
    }

    // Send notifications to relevant parties
    await sendBookingStatusNotification(updatedBooking, item.title, status, userEmail || ownerEmail);

    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to send notifications
async function sendBookingStatusNotification(
  booking: any, 
  itemTitle: string, 
  status: string, 
  actionBy: string
) {
  const isOwnerAction = actionBy === booking.owner_email;
  const isRequesterAction = actionBy === booking.renter_email;
  
  const notifications = [];

  if (status === 'confirmed') {
    // Notify requester that their booking was approved
    notifications.push({
      to: booking.renter_email,
      message: `Your booking request for "${itemTitle}" has been approved!`,
      type: 'booking_approved'
    });
  } else if (status === 'rejected') {
    // Notify requester that their booking was rejected
    notifications.push({
      to: booking.renter_email,
      message: `Your booking request for "${itemTitle}" has been declined.`,
      type: 'booking_rejected'
    });
  } else if (status === 'cancelled') {
    if (isRequesterAction) {
      // Notify owner that requester cancelled
      notifications.push({
        to: booking.owner_email,
        message: `A booking request for "${itemTitle}" has been cancelled by the requester.`,
        type: 'booking_cancelled_by_requester'
      });
    } else if (isOwnerAction) {
      // Notify requester that owner cancelled
      notifications.push({
        to: booking.renter_email,
        message: `Your booking request for "${itemTitle}" has been cancelled by the owner.`,
        type: 'booking_cancelled_by_owner'
      });
    }
  }

  // Log notifications (in a real app, you would send emails/push notifications)
  notifications.forEach(notification => {
  });

  // TODO: Implement actual notification sending
  // - Email notifications
  // - In-app notifications 
  // - SMS notifications (if phone available)
}
