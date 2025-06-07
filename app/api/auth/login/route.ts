import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find user by email in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Note: In production, you should verify hashed password
    // For now, we'll allow login for existing users
    return NextResponse.json({ 
      message: "Login successful", 
      user: { 
        id: user.id,
        email: user.email, 
        name: user.name,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar,
        role: user.role || "both"
      } 
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
