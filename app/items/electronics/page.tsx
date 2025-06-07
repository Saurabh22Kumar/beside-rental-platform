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
import { Star, MapPin, Search, Filter, RefreshCw, Smartphone, Camera, Laptop, Gamepad2, Speaker, Tablet } from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Heart } from "lucide-react"

// Electronics subcategory filter component
function ElectronicsSubcategoryFilter({
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

// Electronics ItemCard component
function ElectronicsItemCard({ item }: { item: any }) {
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
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10">
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
              Electronics
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

export default function ElectronicsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Get URL parameters
  const urlSubcategory = searchParams.get("subcategory") || "all"
  const urlLocation = searchParams.get("location") || "all"
  const urlSearch = searchParams.get("search") || ""
  const urlPrice = searchParams.get("price") ? parseInt(searchParams.get("price")!) : 100
  const urlSort = searchParams.get("sort") || "recommended"

  // State management
  const [selectedSubcategory, setSelectedSubcategory] = useState(urlSubcategory)
  const [selectedLocation, setSelectedLocation] = useState(urlLocation)
  const [priceRange, setPriceRange] = useState([urlPrice])
  const [searchQuery, setSearchQuery] = useState(urlSearch)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [selectedRating, setSelectedRating] = useState("any")
  const [sortBy, setSortBy] = useState(urlSort)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
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
  }, []);

  const electronicsItems = allItems.filter(item => item.category === "Electronics")
  const electronicsSubcategories = [
    { name: "All Electronics", value: "all", icon: <Smartphone className="w-4 h-4" /> },
    { name: "Phone", value: "phone", icon: <Smartphone className="w-4 h-4" /> },
    { name: "Camera", value: "camera", icon: <Camera className="w-4 h-4" /> },
    { name: "Laptop", value: "laptop", icon: <Laptop className="w-4 h-4" /> },
    { name: "Gaming Console", value: "console", icon: <Gamepad2 className="w-4 h-4" /> },
    { name: "Speaker", value: "speaker", icon: <Speaker className="w-4 h-4" /> },
    { name: "Tablet", value: "tablet", icon: <Tablet className="w-4 h-4" /> },
    { name: "TV", value: "tv", icon: <Tablet className="w-4 h-4" /> },
    { name: "Projector", value: "projector", icon: <Camera className="w-4 h-4" /> },
    { name: "Drone", value: "drone", icon: <Camera className="w-4 h-4" /> },
  ]

  // Electronics brands
  const electronicsBrands = [
    "Apple", "Samsung", "Sony", "Canon", "Nikon", "Dell", "HP", "Lenovo", 
    "ASUS", "MSI", "JBL", "Bose", "OnePlus", "Xiaomi", "LG"
  ]

  // Indian cities
  const indianCities = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", 
    "Pune", "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur"
  ]

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
    const filtered = electronicsItems.filter((item) => {
      // Safely check for subcategory match
      const subcategoryMatch = selectedSubcategory === "all" || 
        (item.subcategory && item.subcategory.toLowerCase() === selectedSubcategory.toLowerCase())
      
      // Safely check for location match
      const locationMatch = selectedLocation === "all" || 
        (item.location && item.location.toLowerCase().includes(selectedLocation.toLowerCase()))
      
      // Safely check for price match
      const priceMatch = typeof item.price === 'number' && item.price <= priceRange[0] * 20
      
      // Safely check for search match
      const searchMatch = !searchQuery || 
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.specifications?.Brand && item.specifications.Brand.toLowerCase().includes(searchQuery.toLowerCase()))
      
      // For rating filter, we'll use a default rating since items don't have user ratings in the database
      const defaultRating = 4.0 // Default rating for items without user data
      const ratingMatch = selectedRating === "any" || defaultRating >= parseFloat(selectedRating)
      
      // Safely check for brand match
      const brandMatch = selectedBrands.length === 0 || 
        (item.specifications?.Brand && selectedBrands.includes(item.specifications.Brand))

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
          // Use owner_rating from Supabase data
          const ratingA = a.owner_rating || 0;
          const ratingB = b.owner_rating || 0;
          return ratingB - ratingA;
        case "newest":
          // Use created_at from Supabase
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        default:
          // Safe default sorting using owner rating with fallback
          const defaultRatingA = a.owner_rating || 0;
          const defaultRatingB = b.owner_rating || 0;
          return defaultRatingB - defaultRatingA;
      }
    })

    return sorted
  }, [electronicsItems, selectedSubcategory, selectedLocation, priceRange, searchQuery, selectedRating, selectedBrands, sortBy])

  // Event handlers
  const handleSubcategoryChange = (subcategory: string) => {
    setSelectedSubcategory(subcategory)
    updateURL({
      subcategory,
      location: selectedLocation,
      search: searchQuery,
      price: priceRange[0].toString(),
      sort: sortBy,
    })
  }

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location)
    updateURL({
      subcategory: selectedSubcategory,
      location,
      search: searchQuery,
      price: priceRange[0].toString(),
      sort: sortBy,
    })
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    updateURL({
      subcategory: selectedSubcategory,
      location: selectedLocation,
      search: searchQuery,
      price: priceRange[0].toString(),
      sort,
    })
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get("searchQuery") as string || ""
    
    setSearchQuery(query)
    updateURL({
      subcategory: selectedSubcategory,
      location: selectedLocation,
      search: query,
      price: priceRange[0].toString(),
      sort: sortBy,
    })
  }

  const handleBrandToggle = (brand: string, checked: boolean) => {
    let newBrands: string[]
    if (checked) {
      newBrands = [...selectedBrands, brand]
    } else {
      newBrands = selectedBrands.filter(b => b !== brand)
    }
    setSelectedBrands(newBrands)
  }

  const handleClearFilters = () => {
    setSelectedSubcategory("all")
    setSelectedLocation("all")
    setPriceRange([100])
    setSearchQuery("")
    setSelectedRating("any")
    setSortBy("recommended")
    setSelectedBrands([])
    router.push(pathname)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Electronics Rental</h1>
          <p className="text-muted-foreground">
            Rent the latest electronics from cameras to laptops, all verified and ready to use
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                name="searchQuery"
                placeholder="Search electronics (camera, laptop, iPhone...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            <ElectronicsSubcategoryFilter
              subcategories={electronicsSubcategories}
              selectedSubcategory={selectedSubcategory}
              onSubcategoryChange={handleSubcategoryChange}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Mobile filter toggle */}
          <div className="md:hidden mb-4">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showMobileFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          {/* Filters Sidebar */}
          <div className={`w-full md:w-64 space-y-6 ${showMobileFilters ? "block" : "hidden md:block"}`}>
            {/* Location Filter */}
            <div>
              <h3 className="font-medium mb-3">Location</h3>
              <Select value={selectedLocation} onValueChange={handleLocationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {indianCities.map((city) => (
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
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>₹{priceRange[0] * 20}</span>
                  <span>₹2000+</span>
                </div>
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <h3 className="font-medium mb-3">Minimum Rating</h3>
              <Select value={selectedRating} onValueChange={setSelectedRating}>
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
                {electronicsBrands.map((brand) => (
                  <div key={brand} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-${brand}`}
                      checked={selectedBrands.includes(brand)}
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
                  {filteredAndSortedItems.length} electronics items
                  {selectedSubcategory !== "all" && (
                    <span className="ml-2">
                      • {electronicsSubcategories.find(s => s.value === selectedSubcategory)?.name}
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
                  <ElectronicsItemCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-4">
                  No electronics items found matching your criteria
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