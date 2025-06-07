"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Heart } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"

export default function FavoritesPage() {
  const { user, isAuthenticated } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [removing, setRemoving] = useState<string | null>(null)
  const [allItems, setAllItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load all items from Supabase API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        console.log('Fetching items from API...')
        const response = await fetch('/api/items')
        if (response.ok) {
          const items = await response.json()
          console.log('Fetched items:', items.length, 'items')
          // Set allItems as array directly
          setAllItems(Array.isArray(items) ? items : [])
        } else {
          console.error('Failed to fetch items:', response.status)
          setAllItems([])
        }
      } catch (error) {
        console.error('Error fetching items:', error)
        setAllItems([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchItems()
    
    // Listen for booking updates to refresh data
    const handleRefreshData = () => {
      fetchItems()
    }
    
    window.addEventListener('booking-dates-updated', handleRefreshData)
    
    return () => {
      window.removeEventListener('booking-dates-updated', handleRefreshData)
    }
  }, [])

  // Load favorites from backend if logged in, else localStorage for guests
  useEffect(() => {
    async function fetchFavorites() {
      if (isAuthenticated && user?.email) {
        try {
          const res = await fetch(`/api/users/${encodeURIComponent(user.email)}/favorites`)
          if (res.ok) {
            const data = await res.json()
            console.log('Fetched favorites:', data.favorites)
            setFavoriteIds(data.favorites || [])
          } else {
            console.error('Failed to fetch favorites:', res.status)
            setFavoriteIds([])
          }
        } catch (error) {
          console.error('Error fetching favorites:', error)
          setFavoriteIds([])
        }
      } else if (typeof window !== "undefined") {
        // Always set to [] if no localStorage favorites (prevents stale state)
        const favs = localStorage.getItem("favorites")
        const favoritesList = favs ? JSON.parse(favs) : []
        console.log('Local storage favorites:', favoritesList)
        setFavoriteIds(favoritesList)
      }
    }
    fetchFavorites()
    // Listen for changes to localStorage (e.g., from other tabs)
    function handleStorage(e: StorageEvent) {
      if (!isAuthenticated && e.key === "favorites") {
        setFavoriteIds(e.newValue ? JSON.parse(e.newValue) : [])
      }
    }
    window.addEventListener("storage", handleStorage)
    // Listen for custom event for logged-in users
    function handleFavoritesUpdated() {
      if (isAuthenticated && user?.email) fetchFavorites()
    }
    window.addEventListener("favorites-updated", handleFavoritesUpdated)
    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("favorites-updated", handleFavoritesUpdated)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    // Get item details for all favorite IDs
    console.log('Mapping favorites - favoriteIds:', favoriteIds, 'allItems:', typeof allItems, 'isArray:', Array.isArray(allItems), 'loading:', loading)
    
    // Don't process if still loading or allItems is not a valid array
    if (loading || !Array.isArray(allItems) || allItems.length === 0) {
      console.log('Skipping mapping - loading:', loading, 'allItems valid:', Array.isArray(allItems), 'count:', allItems.length)
      return
    }
    
    const favItems = favoriteIds
      .map((id) => allItems.find((item: any) => item.id === id))
      .filter(Boolean)
    console.log('Found favorite items:', favItems.length)
    setFavorites(favItems)
  }, [favoriteIds, allItems, loading])

  // Remove from favorites handler
  const handleRemove = async (itemId: string) => {
    setRemoving(itemId)
    if (isAuthenticated && user?.email) {
      await fetch(`/api/users/${encodeURIComponent(user.email)}/favorites`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId })
      })
      setFavoriteIds((prev) => prev.filter((id) => id !== itemId))
    } else if (typeof window !== "undefined") {
      let favs = localStorage.getItem("favorites")
      let arr = favs ? JSON.parse(favs) : []
      arr = arr.filter((id: string) => id !== itemId)
      localStorage.setItem("favorites", JSON.stringify(arr))
      setFavoriteIds(arr)
      // Force update in other tabs
      window.dispatchEvent(new StorageEvent("storage", { key: "favorites", newValue: JSON.stringify(arr) }))
    }
    setRemoving(null)
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Heart className="h-7 w-7 text-red-500" /> Favorites
      </h1>
      {loading ? (
        <div className="text-center text-muted-foreground mt-16">
          <p className="text-lg">Loading your favorites...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center text-muted-foreground mt-16">
          <p className="text-lg">You have no favorite items yet.</p>
          <Link href="/items" className="text-primary underline mt-2 inline-block">Browse Items</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favorites.map((item) => (
            <div key={item.id} className="group relative">
              <Link href={`/items/${item.id}`}>
                <Card className="group hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 overflow-hidden h-full">
                  <div className="aspect-square relative overflow-hidden">
                    <Image
                      src={item.images[0]}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-3 flex-1 flex flex-col">
                    <h3 className="font-semibold text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem] text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <div className="flex items-center text-sm text-slate-700 dark:text-slate-200 mb-1 font-medium">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">{item.location}</span>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <Badge variant="secondary" className="text-xs text-slate-800 dark:text-slate-100 font-semibold">
                        {item.category}
                      </Badge>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        ₹{item.price}/day
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-red-100 text-red-500 border border-red-200 shadow"
                onClick={() => handleRemove(item.id)}
                disabled={removing === item.id}
                aria-label="Remove from favorites"
              >
                <Heart className="h-5 w-5 fill-red-500 text-red-600" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
