"use client"

import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Star, MapPin, Search, Filter, RefreshCw, Package, Heart } from "lucide-react"
import { useState, useCallback, useMemo, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

// Others subcategory filter component
function OthersSubcategoryFilter({
  subcategories,
  selectedSubcategory,
  onSubcategoryChange,
}: {
  subcategories: any[]
  selectedSubcategory: string
  onSubcategoryChange: (subcategory: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {subcategories.map((subcategory) => (
        <Button
          key={subcategory.value}
          variant={selectedSubcategory === subcategory.value ? "default" : "outline"}
          size="sm"
          className="flex items-center gap-2"
          onClick={() => onSubcategoryChange(subcategory.value)}
        >
          {subcategory.icon}
          {subcategory.name}
        </Button>
      ))}
    </div>
  )
}

// Others ItemCard component
function OthersItemCard({ item }: { item: any }) {
  const { user, isAuthenticated } = useAuth();
  const userEmail = user?.email;
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (isAuthenticated && userEmail) {
      fetch(`/api/users/${encodeURIComponent(userEmail)}/favorites`)
        .then(res => res.json())
        .then(data => {
          if (data.favorites && Array.isArray(data.favorites)) {
            setIsFavorite(data.favorites.includes(item.id))
          }
        })
    } else if (typeof window !== "undefined") {
      const favs = localStorage.getItem("favorites")
      if (favs) setIsFavorite(JSON.parse(favs).includes(item.id))
    }
  }, [isAuthenticated, userEmail, item.id])

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated && userEmail) {
      const method = isFavorite ? "DELETE" : "POST"
      await fetch(`/api/users/${encodeURIComponent(userEmail)}/favorites`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id })
      })
      setIsFavorite((prev) => !prev)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("favorites-updated"))
      }
    } else if (typeof window !== "undefined") {
      let favs = localStorage.getItem("favorites")
      let arr = favs ? JSON.parse(favs) : []
      if (isFavorite) {
        arr = arr.filter((id: string) => id !== item.id)
      } else {
        arr.push(item.id)
      }
      localStorage.setItem("favorites", JSON.stringify(arr))
      setIsFavorite((prev) => !prev)
      window.dispatchEvent(new StorageEvent("storage", { key: "favorites", newValue: JSON.stringify(arr) }))
    }
  }

  return (
    <Link href={`/items/${item.id}`}>
      <Card className="group hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 overflow-hidden h-full relative">
        <div className="aspect-square relative overflow-hidden">
          <Image
            src={item.images?.[0] || "/placeholder.svg"}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3 z-10">
            <Button
              variant={isFavorite ? "default" : "secondary"}
              size="icon"
              className={`h-8 w-8 rounded-full transition-all duration-200 ${
                isFavorite 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "bg-white/90 hover:bg-white text-gray-600 hover:text-red-500"
              }`}
              onClick={handleFavorite}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {item.location}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">4.5</span>
                <span className="text-sm text-muted-foreground">(12)</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">₹{item.price}</p>
                <p className="text-xs text-muted-foreground">per day</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function OthersPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get("subcategory") || "")
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get("location") || "")
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest")
  const [showFilters, setShowFilters] = useState(false)

  // Others subcategories
  const subcategories = [
    { name: "All Others", value: "", icon: <Package className="h-4 w-4" /> },
    { name: "Other Items", value: "Other Items", icon: <Package className="h-4 w-4" /> },
  ]

  // Available locations
  const locations = [
    "All Locations",
    "Mumbai, Maharashtra",
    "Delhi, NCR", 
    "Bangalore, Karnataka",
    "Hyderabad, Telangana",
    "Chennai, Tamil Nadu",
    "Kolkata, West Bengal",
    "Pune, Maharashtra",
    "Ahmedabad, Gujarat",
    "Jaipur, Rajasthan",
    "Surat, Gujarat"
  ]

  // Fetch items from API
  useEffect(() => {
    let mounted = true
    
    const fetchItems = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/items?category=Others')
        
        if (response.ok && mounted) {
          const data = await response.json()
          setItems(data || [])
        } else if (mounted) {
          setItems([])
        }
      } catch (error) {
        console.error('Error fetching items:', error)
        if (mounted) {
          setItems([])
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchItems()
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      mounted = false
    }
  }, [])

  // Update URL when filters change
  const updateURL = useCallback((newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = [...items]

    // Apply subcategory filter
    if (selectedSubcategory) {
      filtered = filtered.filter(item => item.subcategory === selectedSubcategory)
    }

    // Apply price range filter
    filtered = filtered.filter(item => item.price >= priceRange[0] && item.price <= priceRange[1])

    // Apply location filter
    if (selectedLocation && selectedLocation !== "All Locations") {
      filtered = filtered.filter(item => item.location === selectedLocation)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        case "newest":
        default:
          return new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime()
      }
    })

    return filtered
  }, [items, selectedSubcategory, priceRange, selectedLocation, searchQuery, sortBy])

  const handleSubcategoryChange = (subcategory: string) => {
    setSelectedSubcategory(subcategory)
    updateURL({ subcategory })
  }

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location)
    updateURL({ location: location === "All Locations" ? "" : location })
  }

  const handleSearchChange = (search: string) => {
    setSearchQuery(search)
    updateURL({ search })
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    updateURL({ sort })
  }

  const clearFilters = () => {
    setSelectedSubcategory("")
    setPriceRange([0, 10000])
    setSelectedLocation("")
    setSearchQuery("")
    setSortBy("newest")
    router.push(pathname)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading others items...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Others</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Discover unique and miscellaneous items for rent
        </p>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search others items..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Subcategory Filters */}
        <div className="mt-6">
          <OthersSubcategoryFilter
            subcategories={subcategories}
            selectedSubcategory={selectedSubcategory}
            onSubcategoryChange={handleSubcategoryChange}
          />
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label>Price Range (₹)</Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={10000}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>₹{priceRange[0]}</span>
                    <span>₹{priceRange[1]}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select value={selectedLocation} onValueChange={handleLocationChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results */}
      <div className="mb-6">
        <p className="text-muted-foreground">
          Showing {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <OthersItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedSubcategory || selectedLocation !== "All Locations" 
              ? "Try adjusting your filters or search terms"
              : "Be the first to list an item in the Others category!"
            }
          </p>
          <Link href="/items/new">
            <Button>List Your Item</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
