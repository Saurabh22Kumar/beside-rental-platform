import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch notifications for owners and requesters
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const ownerEmail = url.searchParams.get('ownerEmail');
    const requesterEmail = url.searchParams.get('requesterEmail');

    if (ownerEmail) {
      // Fetch pending requests for items owned by this user
      console.log('Fetching notifications for owner:', ownerEmail);

      // First, get all items owned by this user
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('id, title, price, location')
        .eq('owner_email', ownerEmail);

      if (itemsError) {
        console.error('Error fetching owner items:', itemsError);
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
      }

      if (!items || items.length === 0) {
        return NextResponse.json({ 
          notifications: [],
          pendingCount: 0 
        });
      }

      const itemIds = items.map(item => item.id);

      // Fetch all pending bookings for owner's items
      const { data: pendingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .in('item_id', itemIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching pending bookings:', bookingsError);
        return NextResponse.json({ error: 'Failed to fetch pending bookings' }, { status: 500 });
      }

      // Get requester profiles for phone numbers
      const renterEmails = [...new Set((pendingBookings || []).map(b => b.renter_email))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('email, name, phone')
        .in('email', renterEmails);

      if (profilesError) {
        console.log('Warning: Could not fetch profiles:', profilesError);
      }

      // Combine booking data with item and profile details
      const notifications = (pendingBookings || []).map(booking => {
        const item = items.find(i => i.id === booking.item_id);
        const profile = profiles?.find(p => p.email === booking.renter_email);
        return {
          ...booking,
          item_title: item?.title || 'Unknown Item',
          item_price: item?.price || 0,
          item_location: item?.location || 'Unknown Location',
          renter_name: profile?.name || null,
          renter_phone: profile?.phone || null,
        };
      });

      return NextResponse.json({
        notifications,
        pendingCount: notifications.length
      });
    }

    if (requesterEmail) {
      // Fetch all booking requests made by this user
      console.log('Fetching booking requests for requester:', requesterEmail);

      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('renter_email', requesterEmail)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching requester bookings:', bookingsError);
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
      }

      // Get item details for each booking
      const itemIds = [...new Set((bookings || []).map(b => b.item_id))];
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('id, title, price, location')
        .in('id', itemIds);

      if (itemsError) {
        console.error('Error fetching items for requester bookings:', itemsError);
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
      }

      // Combine booking data with item details
      const notifications = (bookings || []).map(booking => {
        const item = items?.find(i => i.id === booking.item_id);
        return {
          ...booking,
          item_title: item?.title || 'Unknown Item',
          item_price: item?.price || 0,
          item_location: item?.location || 'Unknown Location',
        };
      });

      return NextResponse.json({
        notifications
      });
    }

    return NextResponse.json({ error: 'Missing required parameters (ownerEmail or requesterEmail)' }, { status: 400 });
  } catch (error) {
    console.error('Unexpected error in notifications API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
