import { NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  const decodedEmail = decodeURIComponent(email);
  
  try {
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('email', decodedEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get items owned by this user
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('owner_email', decodedEmail)
      .order('created_at', { ascending: false });

    if (itemsError) {
      return NextResponse.json({ error: "Failed to fetch user items" }, { status: 500 });
    }

    // Create booked dates mapping
    const bookedDates: Record<string, string[]> = {};
    (items || []).forEach((item: any) => {
      bookedDates[item.id] = item.booked_dates || [];
    });

    return NextResponse.json({ items: items || [], bookedDates });
  } catch (error) {
    console.error('Error fetching user items:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
