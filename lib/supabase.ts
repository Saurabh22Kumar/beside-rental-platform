import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side supabase instance (uses anon key, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side supabase instance (uses service role key, bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database Types
export type Item = {
  id: string
  title: string
  description: string
  category: string
  subcategory?: string
  price: number
  location: string
  owner_email: string
  images: string[]
  specifications: Record<string, string>
  features: string[]
  included: string[]
  rules: string[]
  available_from: string
  available_until: string
  min_rental_days: number
  max_rental_days: number
  delivery_available: boolean
  pickup_available: boolean
  cancellation_policy: string
  booked_dates?: string[]
  created_at?: string
  updated_at?: string
}

export type User = {
  id: string
  email: string
  name: string
  phone?: string
  location?: string
  bio?: string
  avatar?: string
  rating?: number
  reviews_count?: number
  favorites?: string[]
  created_at?: string
  updated_at?: string
}

export type Booking = {
  id: string
  item_id: string
  renter_email: string
  owner_email: string
  start_date: string
  end_date: string
  total_days: number
  total_amount: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  created_at?: string
  updated_at?: string
}
