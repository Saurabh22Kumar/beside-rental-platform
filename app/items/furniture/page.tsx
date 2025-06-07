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
import { Star, MapPin, Search, Filter, RefreshCw, Sofa, BedDouble, Table2, BookOpen, Ruler, Armchair, Heart } from "lucide-react"
import { useState, useCallback, useMemo, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

// Furniture subcategories
const furnitureSubcategories = [
  { name: "All", value: "all", icon: null },
  { name: "Sofa", value: "sofa", icon: <Sofa className="h-4 w-4" /> },
  { name: "Bed", value: "bed", icon: <BedDouble className="h-4 w-4" /> },
  { name: "Table", value: "table", icon: <Table2 className="h-4 w-4" /> },
  { name: "Chair", value: "chair", icon: <Armchair className="h-4 w-4" /> },
  { name: "Wardrobe", value: "wardrobe", icon: <BookOpen className="h-4 w-4" /> },
]

const brands = [
  "Urban Ladder",
  "Godrej Interio",
  "IKEA",
  "Pepperfry",
  "Featherlite",
  "Sleepwell",
]

function FurnitureSubcategoryFilter({ subcategories, selectedSubcategory, onSubcategoryChange }: { subcategories: any[]; selectedSubcategory: string; onSubcategoryChange: (subcategory: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
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

function FurnitureItemCard({ item }: { item: any }) {
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
              Furniture
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

// Smart subcategory allocation for furniture
function getFurnitureSubcategory(type: string) {
  const t = type.toLowerCase();
  if (t.includes('sofa')) return 'sofa';
  if (t.includes('bed')) return 'bed';
  if (t.includes('table') || t.includes('desk')) return 'table';
  if (t.includes('chair')) return 'chair';
  if (t.includes('wardrobe')) return 'wardrobe';
  if (t.includes('bookshelf') || t.includes('book shelf') || t.includes('bookcase')) return 'bookshelf';
  return 'other';
}

export default function FurniturePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const urlSubcategory = searchParams.get("subcategory") || "all"
  const urlLocation = searchParams.get("location") || "all"
  const urlSearch = searchParams.get("search") || ""
  const urlPrice = searchParams.get("price") ? parseInt(searchParams.get("price")!) : 100
  const urlSort = searchParams.get("sort") || "recommended"
  const urlBrand = searchParams.get("brand") || "all"

  const [selectedSubcategory, setSelectedSubcategory] = useState(urlSubcategory)
  const [selectedLocation, setSelectedLocation] = useState(urlLocation)
  const [priceRange, setPriceRange] = useState([urlPrice])
  const [searchQuery, setSearchQuery] = useState(urlSearch)
  const [selectedBrand, setSelectedBrand] = useState(urlBrand)
  const [sortBy, setSortBy] = useState(urlSort)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFurnitureItems = () => {
      setLoading(true)
      fetch("/api/items/furniture")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch furniture items")
          return res.json()
        })
        .then((data) => {
          setItems(data)
          setLoading(false)
        })
        .catch((err) => {
          setError(err.message)
          setLoading(false)
        })
    }

    fetchFurnitureItems()
    
    // Listen for booking updates
    const handleRefreshData = () => {
      fetchFurnitureItems()
    }
    
    window.addEventListener('booking-dates-updated', handleRefreshData)
    
    return () => {
      window.removeEventListener('booking-dates-updated', handleRefreshData)
    }
  }, [])

  const updateURL = useCallback((params: Record<string, string>) => {
    const current = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "100" && value !== "recommended") {
        current.set(key, value)
      }
    })
    const search = current.toString()
    const query = search ? `?${search}` : ""
    const newUrl = `${pathname}${query}`
    router.push(newUrl, { scroll: false })
  }, [router, pathname])

  const handleSubcategoryChange = (subcategory: string) => {
    setSelectedSubcategory(subcategory)
    updateURL({
      subcategory,
      location: selectedLocation,
      price: priceRange[0].toString(),
      search: searchQuery,
      brand: selectedBrand,
      sort: sortBy,
    })
  }

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location)
    updateURL({
      subcategory: selectedSubcategory,
      location,
      price: priceRange[0].toString(),
      search: searchQuery,
      brand: selectedBrand,
      sort: sortBy,
    })
  }

  const handlePriceChange = (newPriceRange: number[]) => {
    setPriceRange(newPriceRange)
    updateURL({
      subcategory: selectedSubcategory,
      location: selectedLocation,
      price: newPriceRange[0].toString(),
      search: searchQuery,
      brand: selectedBrand,
      sort: sortBy,
    })
  }

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand)
    updateURL({
      subcategory: selectedSubcategory,
      location: selectedLocation,
      price: priceRange[0].toString(),
      search: searchQuery,
      brand,
      sort: sortBy,
    })
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get("search") as string || ""
    setSearchQuery(query)
    updateURL({
      subcategory: selectedSubcategory,
      location: selectedLocation,
      price: priceRange[0].toString(),
      search: query,
      brand: selectedBrand,
      sort: sortBy,
    })
  }

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy)
    updateURL({
      subcategory: selectedSubcategory,
      location: selectedLocation,
      price: priceRange[0].toString(),
      search: searchQuery,
      brand: selectedBrand,
      sort: newSortBy,
    })
  }

  const handleClearFilters = () => {
    setSelectedSubcategory("all")
    setSelectedLocation("all")
    setPriceRange([100])
    setSearchQuery("")
    setSelectedBrand("all")
    setSortBy("recommended")
    router.push(pathname)
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      let subcategoryMatch = selectedSubcategory === "all";
      if (!subcategoryMatch && item.specifications.Type) {
        const mapped = getFurnitureSubcategory(item.specifications.Type);
        subcategoryMatch = mapped === selectedSubcategory;
      }
      const locationMatch = selectedLocation === "all" || item.location.toLowerCase().includes(selectedLocation.toLowerCase())
      const priceMatch = item.price <= priceRange[0] * 20
      const searchMatch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase())
      const brandMatch = selectedBrand === "all" || (item.specifications.Brand && item.specifications.Brand === selectedBrand)
      return subcategoryMatch && locationMatch && priceMatch && searchMatch && brandMatch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "newest":
          return new Date(b.availableFrom).getTime() - new Date(a.availableFrom).getTime()
        default:
          return 0
      }
    })
  }, [items, selectedSubcategory, selectedLocation, priceRange, searchQuery, selectedBrand, sortBy])

  if (loading) return <div className="p-8 text-center">Loading furniture...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Furniture for Rent</h1>
      {/* Unified Search Bar Design */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              name="searchQuery"
              placeholder="Search furniture (sofa, bed, table...)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" className="sm:w-auto">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </form>
      <FurnitureSubcategoryFilter
        subcategories={furnitureSubcategories}
        selectedSubcategory={selectedSubcategory}
        onSubcategoryChange={handleSubcategoryChange}
      />
      <div className="flex flex-col md:flex-row gap-8 mt-4">
        <div className="w-full md:w-64 space-y-6">
          <div>
            <h3 className="font-medium mb-3">Location</h3>
            <Select value={selectedLocation} onValueChange={handleLocationChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="Andheri">Andheri, Mumbai</SelectItem>
                <SelectItem value="Koramangala">Koramangala, Bangalore</SelectItem>
                <SelectItem value="Banjara Hills">Banjara Hills, Hyderabad</SelectItem>
                <SelectItem value="Connaught Place">Connaught Place, Delhi</SelectItem>
                <SelectItem value="T. Nagar">T. Nagar, Chennai</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <h3 className="font-medium mb-3">Price Range</h3>
            <div className="space-y-4">
              <Slider value={priceRange} onValueChange={handlePriceChange} max={100} step={1} />
              <div className="flex justify-between text-sm">
                <span>₹0</span>
                <span>₹{priceRange[0] * 20}/day</span>
                <span>₹2000/day</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-3">Brand</h3>
            <Select value={selectedBrand} onValueChange={handleBrandChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={handleClearFilters} type="button">
            Clear Filters
          </Button>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <span className="text-muted-foreground">
              Showing {filteredItems.length} furniture items
            </span>
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
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No furniture found matching your filters.</p>
              <Button variant="outline" className="mt-4" onClick={handleClearFilters} type="button">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredItems.map((item) => (
                <FurnitureItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
