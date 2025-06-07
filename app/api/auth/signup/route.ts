import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, name, password, whatsapp, calling, location, role } = await req.json();
    
    if (!email || !name || !password || !whatsapp || !calling || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Create new user in Supabase - using existing schema fields and storing additional data
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        name,
        phone: whatsapp, // Store WhatsApp as primary phone for now
        location,
        bio: JSON.stringify({ 
          whatsapp_number: whatsapp, 
          calling_number: calling, 
          role: role 
        }) // Store additional data in bio field as JSON
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "User created successfully", 
      user: { 
        id: newUser.id,
        email: newUser.email, 
        name: newUser.name,
        phone: newUser.phone,
        location: newUser.location,
        whatsapp_number: whatsapp,
        calling_number: calling,
        role: role
      } 
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
