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
import { Star, MapPin, Search, Filter, RefreshCw, Wrench, Hammer, Scissors, Ruler } from "lucide-react"
import { useState, useCallback, useMemo, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Heart } from "lucide-react"

const cities = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", 
  "Pune", "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur"
]

// Initial function declaration with hooks for data fetching and event handling
function ToolsPageWrapper() {
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
      console.log('Booking dates updated, refreshing tools page data...')
      fetchItems()
    }
    
    window.addEventListener('booking-dates-updated', handleRefreshData)
    
    return () => {
      window.removeEventListener('booking-dates-updated', handleRefreshData)
    }
  }, [])

  return <ToolsPage allItems={allItems} loading={loading} />
}

// Tools subcategory filter component
function ToolsSubcategoryFilter({
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

// Tools ItemCard component
function ToolsItemCard({ item }: { item: any }) {
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
              Tools
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

// Main ToolsPage component
function ToolsPage({ allItems, loading }: { allItems: any[], loading: boolean }) {
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

  // Tools subcategories
  const toolsSubcategories = [
    { name: "All Tools", value: "all", icon: <Wrench className="w-4 h-4" /> },
    { name: "Drill", value: "drill", icon: <Hammer className="w-4 h-4" /> },
    { name: "Ladder", value: "ladder", icon: <Hammer className="w-4 h-4" /> },
    { name: "Saw", value: "saw", icon: <Scissors className="w-4 h-4" /> },
    { name: "Measuring", value: "measuring", icon: <Ruler className="w-4 h-4" /> },
    { name: "Cutter", value: "cutter", icon: <Scissors className="w-4 h-4" /> },
    { name: "Screwdriver", value: "screwdriver", icon: <Wrench className="w-4 h-4" /> },
    { name: "Jigsaw", value: "jigsaw", icon: <Wrench className="w-4 h-4" /> },
    { name: "Multi-Tool", value: "multi-tool", icon: <Wrench className="w-4 h-4" /> },
    { name: "Wrench", value: "wrench", icon: <Wrench className="w-4 h-4" /> },
    { name: "Laser Level", value: "laser-level", icon: <Wrench className="w-4 h-4" /> },
  ]

  // Tools brands
  const toolsBrands = [
    "Bosch", "Black+Decker", "Stanley", "Makita", "Dewalt", "Taparia", "Hitachi", "Hilti", "JCB", "Cheston"
  ]

  // Indian cities
  const indianCities = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", 
    "Pune", "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur"
  ]

  // Filter tools from allItems
  const toolsItems = allItems.filter(item => item.category === "Tools")

  // Update URL function - moved before useMemo to maintain hook order
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
  
  // Filter and sort items - must be before conditional return to maintain hook order
  const filteredAndSortedItems = useMemo(() => {
    const filtered = toolsItems.filter((item) => {
      // Use subcategory field for filtering
      const subcategoryMatch = selectedSubcategory === "all" || (item.subcategory && item.subcategory.toLowerCase() === selectedSubcategory.toLowerCase())
      const locationMatch = selectedLocation === "all" || item.location.toLowerCase().includes(selectedLocation.toLowerCase())
      const priceMatch = item.price <= priceRange[0] * 20
      const searchMatch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.specifications?.Brand && item.specifications?.Brand.toLowerCase().includes(searchQuery.toLowerCase()))
      const brandMatch = selectedBrands.length === 0 || (item.specifications?.Brand && selectedBrands.includes(item.specifications?.Brand))
      return subcategoryMatch && locationMatch && priceMatch && searchMatch && brandMatch
    })
    // Sort items
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "newest":
          // Use created_at from Supabase
          return new Date(b.created_at || b.availableFrom).getTime() - new Date(a.created_at || a.availableFrom).getTime()
        default:
          return 0
      }
    })
    return sorted
  }, [toolsItems, selectedSubcategory, selectedLocation, priceRange, searchQuery, selectedBrands, sortBy])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading tools...</div>
        </div>
      </div>
    )
  }

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
          <h1 className="text-3xl font-bold mb-2">Tools Rental</h1>
          <p className="text-muted-foreground">
            Rent professional and home tools for your next project, all verified and ready to use
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                name="searchQuery"
                placeholder="Search tools (drill, ladder, saw...)"
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
            <ToolsSubcategoryFilter
              subcategories={toolsSubcategories}
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
                {toolsBrands.map((brand) => (
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
                  {filteredAndSortedItems.length} tools items
                  {selectedSubcategory !== "all" && (
                    <span className="ml-2">
                      • {toolsSubcategories.find(s => s.value === selectedSubcategory)?.name}
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
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Items Grid */}
            {filteredAndSortedItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedItems.map((item) => (
                  <ToolsItemCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-4">
                  No tools items found matching your criteria
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

// Export the wrapper component
export default ToolsPageWrapper
