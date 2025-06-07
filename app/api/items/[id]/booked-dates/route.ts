import { NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';
import type { NextRequest } from "next/server";

// GET /api/items/[id]/booked-dates - Get booked dates for an item
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const { data: item, error } = await supabase
      .from('items')
      .select('booked_dates')
      .eq('id', id)
      .single();

    if (error || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ bookedDates: item.booked_dates || [] });
  } catch (error) {
    console.error('Error fetching booked dates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/items/[id]/booked-dates - Update booked dates for an item
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const { dates } = await req.json();
    
    if (!Array.isArray(dates)) {
      return NextResponse.json({ error: 'Dates must be an array' }, { status: 400 });
    }

    // Update the item's booked dates
    const { data: updatedItem, error } = await supabase
      .from('items')
      .update({ booked_dates: dates })
      .eq('id', id)
      .select('booked_dates')
      .single();

    if (error) {
      console.error('Error updating booked dates:', error);
      return NextResponse.json({ error: 'Failed to update booked dates' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      bookedDates: updatedItem?.booked_dates || [] 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
