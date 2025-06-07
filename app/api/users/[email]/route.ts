import { NextResponse } from "next/server"
import { supabase } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', decodeURIComponent(email))
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  try {
    const body = await request.json();
    const { 
      name, 
      phone, 
      location, 
      bio,
      avatar,
      emailNotifications,
      pushNotifications,
      profileVisibility,
      showEmail,
      showPhone
    } = body;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        name,
        phone,
        location,
        bio,
        avatar,
        // Note: email notifications and other settings can be added to schema later
      })
      .eq('email', decodeURIComponent(email))
      .select()
      .single();
    
    if (error || !updatedUser) {
      return NextResponse.json({ error: "User not found or update failed" }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('email', decodeURIComponent(email));

    if (error) {
      return NextResponse.json({ error: "User not found or delete failed" }, { status: 404 })
    }
    
    return NextResponse.json({ message: "User deleted" }, { status: 200 })
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const runtime = "nodejs"
