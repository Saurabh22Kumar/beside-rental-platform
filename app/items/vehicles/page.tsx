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
import { Star, MapPin, Search, Filter, RefreshCw, Car, Bike, Activity, BatteryCharging, Truck } from "lucide-react"
import { useState, useCallback, useMemo, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Heart } from "lucide-react"

// Vehicle subcategory filter
function VehicleSubcategoryFilter({ subcategories, selected, onChange }: { subcategories: any[]; selected: string; onChange: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {subcategories.map(sc => (
        <Button key={sc.value} variant={selected===sc.value?"default":"outline"} size="sm" className="flex items-center gap-1" onClick={()=>onChange(sc.value)}>
          {sc.icon}{sc.name}
        </Button>
      ))}
    </div>
  )
}

// Vehicle card
function VehicleCard({ item }: { item: any }) {
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
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 flex gap-2">
            <Button
              variant={isFavorite ? "default" : "outline"}
              size="icon"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className={
                isFavorite
                  ? "bg-red-100 text-red-600 border-red-200 hover:bg-red-200 hover:text-red-700"
                  : "hover:bg-accent hover:border-primary/30"
              }
              onClick={handleFavorite}
            >
              <Heart
                className={isFavorite ? "h-5 w-5 fill-red-500 text-red-600" : "h-5 w-5 text-muted-foreground"}
                fill={isFavorite ? "#ef4444" : "none"}
              />
            </Button>
          </div>
        </div>
        <CardContent className="p-2 sm:p-3 lg:p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-xs sm:text-sm lg:text-base mb-1 sm:mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[2rem] sm:min-h-[2.5rem]">
            {item.title}
          </h3>
          <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
            <MapPin className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
              Vehicles
            </span>
            <span className="text-xs sm:text-sm font-medium hidden sm:block">
              ₹{item.price}/day
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function VehiclesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const urlSub = searchParams.get("subcategory")||"all"
  const urlLoc = searchParams.get("location")||"all"
  const urlSearch = searchParams.get("search")||""
  // Always default to 5000 if no price param is present
  const urlPriceParam = searchParams.get("price")
  const urlPrice = urlPriceParam ? parseInt(urlPriceParam) : 5000
  const urlSort = searchParams.get("sort")||"recommended"

  const [sub, setSub] = useState(urlSub)
  const [loc, setLoc] = useState(urlLoc)
  const [price, setPrice] = useState([urlPrice])
  const [q, setQ] = useState(urlSearch)
  const [showFilters, setShowFilters] = useState(false)
  const [rating, setRating] = useState("any")
  const [sortBy, setSortBy] = useState(urlSort)
  const [brands, setBrands] = useState<string[]>([])

  const subcategories = [
    { name:"All Vehicles", value:"all", icon:<Car className="w-4 h-4"/> },
    { name:"Bikes", value:"bike", icon:<Activity className="w-4 h-4"/> },
    { name:"Scooters", value:"scooter", icon:<Bike className="w-4 h-4"/> },
    { name:"Cars", value:"car", icon:<Car className="w-4 h-4"/> },
    { name:"E-SUVs", value:"e-suv", icon:<BatteryCharging className="w-4 h-4"/> },
    { name:"SUVs", value:"suv", icon:<Truck className="w-4 h-4"/> },
  ]
  const brandsList = ["Royal Enfield","Honda","Maruti","Tesla","BMW","Hyundai","Kawasaki","Ola","Tata","Hero"]
  const cities = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", 
    "Pune", "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur"
  ]

  const [allItems, setAllItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch items from Supabase API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/items')
        if (response.ok) {
          const items = await response.json()
          setAllItems(items)
        }
      } catch (error) {
        console.error('Error fetching items:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchItems()
    
    // Listen for booking updates
    const handleRefreshData = () => {
      fetchItems()
    }
    
    window.addEventListener('booking-dates-updated', handleRefreshData)
    
    return () => {
      window.removeEventListener('booking-dates-updated', handleRefreshData)
    }
  }, [])

  const vehicleItems = allItems.filter(item => item.category === "Vehicles")

  // Update URL function
  const updateURL = useCallback(
    (params: Record<string, string>) => {
      const current = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "" && value !== "100" && value !== "recommended") {
          current.set(key, value)
        }
      })
      const search = current.toString()
      const query = search ? `?${search}` : ""
      const newUrl = `${pathname}${query}`
      router.push(newUrl, { scroll: false })
    },
    [router, pathname]
  )

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    const filtered = vehicleItems.filter((item) => {
      // Fallback: treat all as 'all' if subcategory missing
      const subcategoryValue = (item as any).subcategory || "all"
      const brandValue = (item as any).brand || (item.specifications && item.specifications.Brand) || ""
      const subcategoryMatch = sub === "all" || subcategoryValue === sub
      const locationMatch = loc === "all" || item.location.toLowerCase().includes(loc.toLowerCase())
      const priceMatch = item.price <= price[0]
      const searchMatch = !q || 
        item.title.toLowerCase().includes(q.toLowerCase()) ||
        item.description.toLowerCase().includes(q.toLowerCase()) ||
        (brandValue && brandValue.toLowerCase().includes(q.toLowerCase()))
      const ratingMatch = rating === "any" || (item.owner_rating ?? 0) >= parseFloat(rating)
      const brandMatch = brands.length === 0 || brands.includes(brandValue)
      return subcategoryMatch && locationMatch && priceMatch && searchMatch && ratingMatch && brandMatch
    })
    // Sort items
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return (b.owner_rating ?? 0) - (a.owner_rating ?? 0)
        case "newest":
          return new Date(b.created_at || b.availableFrom).getTime() - new Date(a.created_at || a.availableFrom).getTime()
        default:
          return (b.owner_rating ?? 0) - (a.owner_rating ?? 0)
      }
    })
    return sorted
  }, [vehicleItems, sub, loc, price, q, rating, brands, sortBy])

  // Event handlers
  const handleSubcategoryChange = (subcategory: string) => {
    setSub(subcategory)
    updateURL({
      subcategory,
      location: loc,
      search: q,
      price: price[0].toString(),
      sort: sortBy,
    })
  }
  const handleLocationChange = (location: string) => {
    setLoc(location)
    updateURL({
      subcategory: sub,
      location,
      search: q,
      price: price[0].toString(),
      sort: sortBy,
    })
  }
  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    updateURL({
      subcategory: sub,
      location: loc,
      search: q,
      price: price[0].toString(),
      sort,
    })
  }
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get("searchQuery") as string || ""
    setQ(query)
    updateURL({
      subcategory: sub,
      location: loc,
      search: query,
      price: price[0].toString(),
      sort: sortBy,
    })
  }
  const handleBrandToggle = (brand: string, checked: boolean) => {
    let newBrands: string[]
    if (checked) {
      newBrands = [...brands, brand]
    } else {
      newBrands = brands.filter(b => b !== brand)
    }
    setBrands(newBrands)
  }
  const handleClearFilters = () => {
    setSub("all")
    setLoc("all")
    setPrice([5000])
    setQ("")
    setRating("any")
    setSortBy("recommended")
    setBrands([])
    router.push(pathname)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Vehicle Rentals</h1>
          <p className="text-muted-foreground">
            Rent bikes, scooters, cars and more
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                name="searchQuery"
                placeholder="Search vehicles (bike, car, scooter...)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit" className="sm:w-auto">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </div>

        {/* Subcategory Filter */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            <VehicleSubcategoryFilter
              subcategories={subcategories}
              selected={sub}
              onChange={handleSubcategoryChange}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Mobile filter toggle */}
          <div className="md:hidden mb-4">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          {/* Filters Sidebar */}
          <div className={`w-full md:w-64 space-y-6 ${showFilters ? "block" : "hidden md:block"}`}>
            {/* Location Filter */}
            <div>
              <h3 className="font-medium mb-3">Location</h3>
              <Select value={loc} onValueChange={handleLocationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="font-medium mb-3">Price Range (per day)</h3>
              <div className="space-y-3">
                <Slider
                  value={price}
                  onValueChange={setPrice}
                  max={5000}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>₹{price[0]}</span>
                  <span>₹5000</span>
                </div>
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <h3 className="font-medium mb-3">Minimum Rating</h3>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Rating</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  <SelectItem value="4.0">4.0+ Stars</SelectItem>
                  <SelectItem value="3.5">3.5+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Brand Filter */}
            <div>
              <h3 className="font-medium mb-3">Brands</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {brandsList.map((brand) => (
                  <div key={brand} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-${brand}`}
                      checked={brands.includes(brand)}
                      onCheckedChange={(checked) => handleBrandToggle(brand, checked as boolean)}
                    />
                    <Label htmlFor={`brand-${brand}`} className="text-sm">
                      {brand}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <Button variant="outline" onClick={handleClearFilters} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <span className="text-lg font-medium">
                  {filteredAndSortedItems.length} vehicle items
                  {sub !== "all" && (
                    <span className="ml-2">
                      • {subcategories.find(s => s.value === sub)?.name}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">Recommended</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Items Grid */}
            {filteredAndSortedItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedItems.map((item) => (
                  <VehicleCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-4">
                  No vehicle items found matching your criteria
                </p>
                <Button onClick={handleClearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
