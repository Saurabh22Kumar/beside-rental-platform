import { NextRequest, NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';

// GET /api/users/[email]/favorites
export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('favorites')
      .eq('email', decodeURIComponent(email))
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ favorites: user.favorites || [] });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/users/[email]/favorites
// Body: { itemId: string }
export async function POST(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  const decodedEmail = decodeURIComponent(email);
  
  try {
    const { itemId } = await req.json();
    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    // Get current user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('favorites')
      .eq('email', decodedEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentFavorites = user.favorites || [];
    if (!currentFavorites.includes(itemId)) {
      const updatedFavorites = [...currentFavorites, itemId];
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ favorites: updatedFavorites })
        .eq('email', decodedEmail)
        .select('favorites')
        .single();

      if (updateError) {
        return NextResponse.json({ error: "Failed to update favorites" }, { status: 500 });
      }

      return NextResponse.json({ favorites: updatedUser.favorites || [] });
    }

    return NextResponse.json({ favorites: currentFavorites });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/users/[email]/favorites
// Body: { itemId: string }
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  const decodedEmail = decodeURIComponent(email);
  
  try {
    const { itemId } = await req.json();
    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    // Get current user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('favorites')
      .eq('email', decodedEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentFavorites = user.favorites || [];
    const updatedFavorites = currentFavorites.filter((id: string) => id !== itemId);

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ favorites: updatedFavorites })
      .eq('email', decodedEmail)
      .select('favorites')
      .single();

    if (updateError) {
      return NextResponse.json({ error: "Failed to update favorites" }, { status: 500 });
    }

    return NextResponse.json({ favorites: updatedUser.favorites || [] });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
