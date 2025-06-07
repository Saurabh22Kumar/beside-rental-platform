import { NextResponse } from "next/server"
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Filter items with category 'Travel Gare' from Supabase
    const { data: travelGearItems, error } = await supabase
      .from('items')
      .select('*')
      .eq('category', 'Travel Gare')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching travel gear items:', error);
      return NextResponse.json({ error: 'Failed to fetch travel gear items' }, { status: 500 });
    }

    return NextResponse.json(travelGearItems || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
