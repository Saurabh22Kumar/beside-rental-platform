import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Filter items with category 'Furniture' from Supabase
    const { data: furnitureItems, error } = await supabase
      .from('items')
      .select('*')
      .eq('category', 'Furniture')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching furniture items:', error);
      return NextResponse.json({ error: 'Failed to fetch furniture items' }, { status: 500 });
    }

    return NextResponse.json(furnitureItems || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
