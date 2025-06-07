"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Star, MapPin } from "lucide-react"
import { useState, useEffect } from "react"
import { Combobox } from "@headlessui/react"
import Link from "next/link"
import Fuse from "fuse.js"
import type { Item } from "@/lib/database"

const categories = [
  "Electronics",
  "Vehicles", 
  "Sports",
  "Tools",
  "Furniture",
  "Travel Gare",
  "Books",
  "Others"
]

const indianCities = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Surat",
  "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ludhiana"
]

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("")
  const [query, setQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [allItems, setAllItems] = useState<Item[]>([])
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
    
    // Listen for custom event to refresh data when items are updated
    const handleRefreshData = () => {
      fetchItems()
    }
    
    window.addEventListener('booking-dates-updated', handleRefreshData)
    
    return () => {
      window.removeEventListener('booking-dates-updated', handleRefreshData)
    }
  }, [])

  // Generate search data based on current items
  const productTitles = allItems.map(item => item.title)
  const fuse = new Fuse<Item>(allItems, {
    keys: ["title", "description", "location", "category", "specifications.Brand", "specifications.Type"],
    threshold: 0.4,
  })

  // Filter items by search term (title, description, location)
  const filteredItems: Item[] = searchTerm.trim() === "" ? allItems : fuse.search(searchTerm).map((result) => result.item)

  // Only include categories with at least one matching item
  const itemsByCategory = categories
    .map(category => ({
      category,
      items: filteredItems.filter((item: Item) => item.category === category).slice(0, 4)
    }))
    .filter(({ items }) => items.length > 0)

  // Filter suggestions for products and cities
  const filteredProducts = query === "" ? productTitles.slice(0, 5) : productTitles.filter(title => title.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
  const filteredCities = query === "" ? indianCities.slice(0, 5) : indianCities.filter(city => city.toLowerCase().includes(query.toLowerCase())).slice(0, 5)

  return (
    <div className="container mx-auto py-8">
      {/* --- HERO SECTION RESTORED --- */}
      <section className="bg-gradient-to-r from-orange-50 to-green-50 dark:from-orange-950 dark:to-green-950 py-16">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Rent from your neighbors across India</h1>
            <p className="text-lg mb-6 text-muted-foreground">
              Save money and reduce waste by renting items you need occasionally. From Mumbai to Delhi, connect with
              people in your city and make money from items you rarely use.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg">
                <a href="/signup">Join Community</a>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <Image
              src="/placeholder.svg?height=400&width=500"
              alt="People sharing items in India"
              width={500}
              height={400}
              className="rounded-lg shadow-lg"
              priority
            />
          </div>
        </div>
      </section>
      <div className="max-w-xl mx-auto mb-8">
        <Combobox value={searchTerm} onChange={value => { setSearchTerm(value ?? ""); setQuery(value ?? ""); }}>
          <div className="relative">
            <Combobox.Input
              className="w-full px-6 py-4 border rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search for items, products, or city..."
              value={query}
              onChange={e => { setQuery(e.target.value); setSearchTerm(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            />
            {showSuggestions && (filteredProducts.length > 0 || filteredCities.length > 0) && (
              <Combobox.Options className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-[80vh] overflow-auto">
                {filteredProducts.length > 0 && (
                  <div className="px-4 py-2 text-xs text-muted-foreground">Products</div>
                )}
                {filteredProducts.map(product => (
                  <Combobox.Option key={product} value={product} className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-gray-900 text-gray-100 font-bold' : ''}`}>
                    {product}
                  </Combobox.Option>
                ))}
                {filteredCities.length > 0 && (
                  <div className="px-4 py-2 text-xs text-muted-foreground border-t border-gray-100 dark:border-gray-800">Cities</div>
                )}
                {filteredCities.map(city => (
                  <Combobox.Option key={city} value={city} className={({ active }) => `cursor-pointer px-4 py-2 ${active ? 'bg-gray-900 text-gray-100 font-bold' : ''}`}>
                    {city}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            )}
          </div>
        </Combobox>
      </div>
      <div className="space-y-12">
        {itemsByCategory.length === 0 ? null : itemsByCategory.map(({ category, items }) => (
          <div key={category}>
            <Link href={category === "Books" ? "/items/book" : `/items/${category.toLowerCase().replace(/\s+/g, "-")}`}> 
              <h2 className="text-2xl font-semibold mb-4 cursor-pointer hover:underline">{category}</h2>
            </Link>
            {/* Responsive Grid: Mobile(1), Tablet(2), Desktop(3-4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {items.map((item: Item) => (
                <Link key={item.id} href={`/items/${item.id}`}>
                  <Card className="group hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 overflow-hidden h-full">
                    <div className="aspect-square relative overflow-hidden">
                      <Image
                        src={item.images?.[0] || "/placeholder.svg"}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
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
                          {item.category}
                        </span>
                        <span className="text-xs sm:text-sm font-medium hidden sm:block">
                          ₹{item.price}/day
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* --- TESTIMONIALS SECTION RESTORED --- */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">What Our Indian Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                  <span className="font-semibold text-primary">RK</span>
                </div>
                <div>
                  <h4 className="font-semibold">Rahul Kumar</h4>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground">
                "I saved ₹15,000 by renting a pressure washer instead of buying one for my home renovation in Gurgaon.
                The process was smooth and the owner was very helpful!"
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                  <span className="font-semibold text-primary">AS</span>
                </div>
                <div>
                  <h4 className="font-semibold">Anita Sharma</h4>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground">
                "I've been making extra income by renting out my camera equipment in Mumbai. It was sitting in my closet
                for months, and now it's actually paying for itself!"
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                  <span className="font-semibold text-primary">VG</span>
                </div>
                <div>
                  <h4 className="font-semibold">Vikash Gupta</h4>
                  <div className="flex text-yellow-400">
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                    <Star className="h-4 w-4 text-yellow-400" />
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground">
                "Beside has changed how I think about ownership in India. Why buy when you can rent? It's better for my
                wallet and for the environment."
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
