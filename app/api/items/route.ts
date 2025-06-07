import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET /api/items - Get all items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let query = supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category);
    }

    const { data: items, error } = await query;

    if (error) {
      console.error('Error fetching items:', error);
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    return NextResponse.json(items || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/items - Create new item (uses admin client to bypass RLS)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Environment check:', {
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
    });
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'price', 'location', 'owner_email'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Add default values for required database fields if not provided
    const itemData = {
      ...body,
      available_from: body.available_from || new Date().toISOString().split('T')[0],
      available_until: body.available_until || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      images: body.images || ['/placeholder.svg?height=300&width=400'],
      specifications: body.specifications || {},
      features: body.features || [],
      included: body.included || [],
      rules: body.rules || [],
      min_rental_days: body.min_rental_days || 1,
      max_rental_days: body.max_rental_days || 30,
      delivery_available: body.delivery_available ?? true,
      pickup_available: body.pickup_available ?? true,
      cancellation_policy: body.cancellation_policy || 'Free cancellation up to 24 hours before rental',
      booked_dates: body.booked_dates || []
    };

    // Use regular client (admin client has invalid key issue)
    console.log('Creating item with regular client...');
    const { data: item, error } = await supabase
      .from('items')
      .insert([itemData])
      .select()
      .single();

    if (error) {
      console.error('Error creating item:', error);
      return NextResponse.json({ error: 'Failed to create item', details: error.message }, { status: 500 });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
