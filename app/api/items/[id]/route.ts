import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    
    // Fetch single item by ID from Supabase
    const { data: item, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Item not found
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      console.error('Error fetching item:', error);
      return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
    }

    // Fetch owner details based on owner_email
    let owner = null;
    if (item.owner_email) {
      const { data: ownerData, error: ownerError } = await supabase
        .from('users')
        .select('id, name, email, phone, location, bio, avatar, rating, reviews_count, created_at')
        .eq('email', item.owner_email)
        .single();

      if (!ownerError && ownerData) {
        // Parse additional data from bio field if available
        let additionalData: {
          whatsapp_number?: string;
          calling_number?: string;
          role?: string;
        } = {};
        
        if (ownerData.bio) {
          try {
            const parsed = JSON.parse(ownerData.bio);
            additionalData = parsed || {};
          } catch (e) {
            console.log('Could not parse bio data for user:', ownerData.email);
          }
        }

        owner = {
          id: ownerData.id,
          name: ownerData.name,
          email: ownerData.email,
          phone: ownerData.phone,
          location: ownerData.location,
          avatar: ownerData.avatar || "/placeholder-user.jpg",
          rating: ownerData.rating || 0,
          reviews: ownerData.reviews_count || 0,
          verified: true, // You can implement verification logic later
          created_at: ownerData.created_at,
          whatsapp_number: additionalData.whatsapp_number || ownerData.phone,
          calling_number: additionalData.calling_number || ownerData.phone,
          role: additionalData.role || 'both',
          responseTime: "within 2 hours" // Default response time
        };
      }
    }

    // Return item with owner information
    return NextResponse.json({
      ...item,
      owner: owner
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    
    // Delete item by ID from Supabase
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting item:', error);
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    
    // Extract updateable fields (only fields that exist in the database)
    const {
      title,
      description,
      category,
      subcategory,
      price,
      location,
      images,
      features,
      specifications,
      included,
      rules,
      available_from,
      available_until,
      min_rental_days,
      max_rental_days,
      delivery_available,
      pickup_available,
      cancellation_policy,
      booked_dates
    } = body;

    // Build update object with only provided fields that exist in DB
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (subcategory !== undefined) updateData.subcategory = subcategory;
    if (price !== undefined) updateData.price = price;
    if (location !== undefined) updateData.location = location;
    if (images !== undefined) updateData.images = images;
    if (features !== undefined) updateData.features = features;
    if (specifications !== undefined) updateData.specifications = specifications;
    if (included !== undefined) updateData.included = included;
    if (rules !== undefined) updateData.rules = rules;
    if (available_from !== undefined) updateData.available_from = available_from;
    if (available_until !== undefined) updateData.available_until = available_until;
    if (min_rental_days !== undefined) updateData.min_rental_days = min_rental_days;
    if (max_rental_days !== undefined) updateData.max_rental_days = max_rental_days;
    if (delivery_available !== undefined) updateData.delivery_available = delivery_available;
    if (pickup_available !== undefined) updateData.pickup_available = pickup_available;
    if (cancellation_policy !== undefined) updateData.cancellation_policy = cancellation_policy;
    if (booked_dates !== undefined) updateData.booked_dates = booked_dates;
    
    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // Update item in Supabase
    const { data: updatedItem, error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating item:', error);
      return NextResponse.json({ 
        error: 'Failed to update item',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
