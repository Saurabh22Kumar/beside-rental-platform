import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Bookings API is working', status: 'success' });
}
