import { supabase } from './supabase'
import type { Item, User, Booking } from './supabase'

// Items
export async function getAllItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching items:', error)
    return []
  }

  return data || []
}

export async function getItemById(id: string): Promise<Item | null> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching item:', error)
    return null
  }

  return data
}

export async function getItemsByCategory(category: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching items by category:', error)
    return []
  }

  return data || []
}

export async function getItemsByOwner(ownerEmail: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('owner_email', ownerEmail)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching items by owner:', error)
    return []
  }

  return data || []
}

export async function createItem(item: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Promise<Item | null> {
  const { data, error } = await supabase
    .from('items')
    .insert(item)
    .select()
    .single()

  if (error) {
    console.error('Error creating item:', error)
    return null
  }

  return data
}

export async function updateItem(id: string, updates: Partial<Item>): Promise<Item | null> {
  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating item:', error)
    return null
  }

  return data
}

export async function deleteItem(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting item:', error)
    return false
  }

  return true
}

// Users
export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return data
}

export async function createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .insert(user)
    .select()
    .single()

  if (error) {
    console.error('Error creating user:', error)
    return null
  }

  return data
}

export async function updateUser(email: string, updates: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('email', email)
    .select()
    .single()

  if (error) {
    console.error('Error updating user:', error)
    return null
  }

  return data
}

export async function addToFavorites(userEmail: string, itemId: string): Promise<boolean> {
  const user = await getUserByEmail(userEmail)
  if (!user) return false

  const favorites = user.favorites || []
  if (favorites.includes(itemId)) return true

  const updatedFavorites = [...favorites, itemId]
  
  const { error } = await supabase
    .from('users')
    .update({ favorites: updatedFavorites })
    .eq('email', userEmail)

  return !error
}

export async function removeFromFavorites(userEmail: string, itemId: string): Promise<boolean> {
  const user = await getUserByEmail(userEmail)
  if (!user) return false

  const favorites = user.favorites || []
  const updatedFavorites = favorites.filter(id => id !== itemId)
  
  const { error } = await supabase
    .from('users')
    .update({ favorites: updatedFavorites })
    .eq('email', userEmail)

  return !error
}

// Bookings
export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .insert(booking)
    .select()
    .single()

  if (error) {
    console.error('Error creating booking:', error)
    return null
  }

  return data
}

export async function getBookingsByUser(userEmail: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .or(`renter_email.eq.${userEmail},owner_email.eq.${userEmail}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user bookings:', error)
    return []
  }

  return data || []
}

export async function updateBookingStatus(id: string, status: Booking['status']): Promise<boolean> {
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)

  return !error
}

// Search
export async function searchItems(query: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error searching items:', error)
    return []
  }

  return data || []
}
