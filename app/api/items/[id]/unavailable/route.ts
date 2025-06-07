import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch unavailable dates for an item
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    
    // Fetch the item's booked_dates array which contains all unavailable dates
    const { data: item, error } = await supabase
      .from('items')
      .select('booked_dates')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching item booked dates:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch unavailable dates',
        unavailableDates: [] // Return empty array as fallback
      }, { status: 200 });
    }

    // Transform booked_dates array to match expected unavailable dates format
    const bookedDates = item?.booked_dates || [];
    const transformedDates = bookedDates.map((date: string, index: number) => ({
      id: `${id}-${date}-${index}`, // Generate a unique ID
      item_id: id,
      unavailable_date: date,
      reason: 'Booked or owner unavailable',
      created_at: new Date().toISOString()
    }));

    return NextResponse.json({ unavailableDates: transformedDates });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      unavailableDates: []
    }, { status: 200 });
  }
}

// POST - Add unavailable dates (for owners)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const { ownerEmail, dates, isRecurring, recurringType } = body;

    console.log('POST request to unavailable dates:', { id, ownerEmail, dates, isRecurring, recurringType });

    if (!ownerEmail || !dates || !Array.isArray(dates)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // First, get the current item to verify ownership and get current booked_dates
    const { data: item, error: fetchError } = await supabase
      .from('items')
      .select('owner_email, booked_dates')
      .eq('id', id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Verify ownership
    if (item.owner_email !== ownerEmail) {
      return NextResponse.json({ error: 'Unauthorized: Only item owner can set unavailable dates' }, { status: 403 });
    }

    // Merge new dates with existing booked_dates (remove duplicates)
    const currentBookedDates = item.booked_dates || [];
    const allDates = [...new Set([...currentBookedDates, ...dates])];

    console.log('Updating booked_dates from', currentBookedDates, 'to', allDates);

    // Update the item's booked_dates array
    const { data, error } = await supabase
      .from('items')
      .update({ 
        booked_dates: allDates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('booked_dates')
      .single();

    if (error) {
      console.error('Error adding unavailable dates:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: 'Failed to add unavailable dates',
        details: error.message || 'Unknown error',
        code: error.code
      }, { status: 500 });
    }

    // Transform back to expected format
    const bookedDates = data?.booked_dates || [];
    const transformedDates = dates.map((date: string, index: number) => ({
      id: `${id}-${date}-${index}`,
      item_id: id,
      unavailable_date: date,
      reason: isRecurring ? `Recurring ${recurringType} unavailability` : 'Owner unavailable',
      created_at: new Date().toISOString()
    }));

    return NextResponse.json({ unavailableDates: transformedDates });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove unavailable dates (for owners)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const { ownerEmail, dates } = body;

    if (!ownerEmail || !dates || !Array.isArray(dates)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the current item to verify ownership and get current booked_dates
    const { data: item, error: fetchError } = await supabase
      .from('items')
      .select('owner_email, booked_dates')
      .eq('id', id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Verify ownership
    if (item.owner_email !== ownerEmail) {
      return NextResponse.json({ error: 'Unauthorized: Only item owner can remove unavailable dates' }, { status: 403 });
    }

    // Remove the specified dates from booked_dates array
    const currentBookedDates = item.booked_dates || [];
    const updatedDates = currentBookedDates.filter((date: string) => !dates.includes(date));

    console.log('Removing dates', dates, 'from', currentBookedDates, 'result:', updatedDates);

    // Update the item's booked_dates array
    const { error } = await supabase
      .from('items')
      .update({ 
        booked_dates: updatedDates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error removing unavailable dates:', error);
      return NextResponse.json({ error: 'Failed to remove unavailable dates' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Unavailable dates removed successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
