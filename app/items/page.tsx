"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Search, Filter, Star } from "lucide-react"

export default function ItemsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [allItems, setAllItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch items from Supabase API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/items')
        if (response.ok) {
          const items = await response.json()
          setAllItems(items)
        } else {
          console.error('Failed to fetch items')
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
      fetchItems() // Refresh items from API
    }
    
    window.addEventListener('booking-dates-updated', handleRefreshData)
    
    return () => {
      window.removeEventListener('booking-dates-updated', handleRefreshData)
    }
  }, [])

  // Filter items based on search and filters
  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    const matchesLocation = selectedLocation === "all" || item.location === selectedLocation
    
    return matchesSearch && matchesCategory && matchesLocation
  })

  // Get unique categories and locations
  const categories = [...new Set(allItems.map(item => item.category))]
  const locations = [...new Set(allItems.map(item => item.location))]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-6 lg:py-12">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-900 mb-2 sm:mb-3 lg:mb-4">
            Browse All Items
          </h1>
          <p className="text-sm sm:text-base lg:text-xl text-slate-600 max-w-2xl mx-auto px-2">
            Discover amazing items available for rent in your area
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-slate-200 mb-4 sm:mb-6 lg:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-3 w-3 sm:h-4 sm:w-4" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 sm:pl-10 text-sm sm:text-base h-8 sm:h-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
          <p className="text-xs sm:text-sm lg:text-base text-slate-600">
            Found <span className="font-semibold">{filteredItems.length}</span> item{filteredItems.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredItems.map(item => (
            <Link key={item.id} href={`/items/${item.id}`}>
              <Card className="group hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 overflow-hidden h-full">
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src={item.images[0]}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-2 sm:p-3 lg:p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-xs sm:text-sm lg:text-base mb-1 sm:mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[2rem] sm:min-h-[2.5rem] text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h3>
                  <div className="flex items-center text-xs sm:text-sm text-slate-700 dark:text-slate-200 mb-1 sm:mb-2 font-medium">
                    <MapPin className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                    <span className="truncate">{item.location}</span>
                  </div>
                  
                  {/* Rating Display */}
                  {item.rating && item.rating > 0 ? (
                    <div className="flex items-center gap-1 mb-1 sm:mb-2">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                        {item.rating}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({item.reviews_count || 0})
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 sm:mb-2">
                      No reviews yet
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-auto">
                    <Badge variant="secondary" className="text-xs text-slate-800 dark:text-slate-100 font-semibold">
                      {item.category}
                    </Badge>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                      ₹{item.price}/day
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* No Results */}
        {filteredItems.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">🔍</div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-1 sm:mb-2">No items found</h3>
            <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 px-4">Try adjusting your search criteria or browse all items.</p>
            <Button 
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("all")
                setSelectedLocation("all")
              }}
              className="text-sm sm:text-base px-4 sm:px-6"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
