"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, MapPin, Star, Shield, MessageCircle, Phone, User, Share2, Heart } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from 'next/navigation'
import React from "react"
import { Item } from "@/lib/supabase"
import BookingCalendar from "@/components/booking-calendar"
import ReviewsDisplay from "@/components/reviews-display"
import ReviewSubmissionForm from "@/components/review-submission-form"
import RatingSummary from "@/components/rating-summary"


// CATEGORY OWNER MAP - DEPRECATED: Now using real user data from database
// const CATEGORY_OWNER_MAP: Record<string, any> = {
//   electronics: {
//     name: "Rohit Sharma",
//     email: "rohit@xyz.com",
//     avatar: "/placeholder-user.jpg",
//     phone: "+91 9876543210",
//     verified: true,
//     rating: 4.8,
//     reviews: 120,
//     createdAt: "2022-01-15T00:00:00.000Z",
//     responseTime: "within 1 hour"
//   },
//   vehicles: {
//     name: "Amit Singh",
//     email: "amit@xyz.com",
//     avatar: "/placeholder-user.jpg",
//     phone: "+91 9123456780",
//     verified: true,
//     rating: 4.6,
//     reviews: 85,
//     createdAt: "2021-08-10T00:00:00.000Z",
//     responseTime: "within 2 hours"
//   },
//   sports: {
//     name: "Priya Verma",
//     email: "priya@xyz.com",
//     avatar: "/placeholder-user.jpg",
//     phone: "+91 9988776655",
//     verified: false,
//     rating: 4.2,
//     reviews: 40,
//     createdAt: "2023-03-05T00:00:00.000Z",
//     responseTime: "within 4 hours"
//   },
//   tools: {
//     name: "Suresh Kumar",
//     email: "suresh@xyz.com",
//     avatar: "/placeholder-user.jpg",
//     phone: "+91 9001122334",
//     verified: true,
//     rating: 4.5,
//     reviews: 60,
//     createdAt: "2022-11-20T00:00:00.000Z",
//     responseTime: "within 3 hours"
//   },
//   furniture: {
//     name: "Anjali Mehta",
//     email: "anjali@xyz.com",
//     avatar: "/placeholder-user.jpg",
//     phone: "+91 9090909090",
//     verified: false,
//     rating: 4.0,
//     reviews: 30,
//     createdAt: "2023-05-01T00:00:00.000Z",
//     responseTime: "within 6 hours"
//   },
//   book: {
//     name: "Book Owner",
//     email: "book@xyz.com",
//     avatar: "/placeholder-user.jpg",
//     phone: "+91 9112233445",
//     verified: false,
//     rating: 4.1,
//     reviews: 15,
//     createdAt: "2024-01-01T00:00:00.000Z",
//     responseTime: "within 8 hours"
//   },
//   "travel-gare": {
//     name: "Travel Owner",
//     email: "travel@xyz.com",
//     avatar: "/placeholder-user.jpg",
//     phone: "+91 9223344556",
//     verified: true,
//     rating: 4.7,
//     reviews: 50,
//     createdAt: "2022-09-09T00:00:00.000Z",
//     responseTime: "within 2 hours"
//   }
// };

export default function ItemPageClient({ itemId }: { itemId: string }) {
  const router = useRouter()
  const [item, setItem] = useState<Item | null>(null);
  const [owner, setOwner] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0)
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const userEmail = user?.email;

  // Fetch item data from Supabase API
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`/api/items/${itemId}`)
        if (response.ok) {
          const itemData = await response.json()
          setItem(itemData)
          // Set owner data from API response
          setOwner(itemData.owner || null)
        } else if (response.status === 404) {
          console.error('Item not found')
          setItem(null)
          setOwner(null)
        }
      } catch (error) {
        console.error('Error fetching item:', error)
        setItem(null)
        setOwner(null)
      }
    }
    
    fetchItem();
    
    // Listen for booking updates
    const handleRefreshData = () => {
      fetchItem();
    };
    
    window.addEventListener('booking-dates-updated', handleRefreshData);
    
    return () => {
      window.removeEventListener('booking-dates-updated', handleRefreshData);
    };
  }, [itemId]);

  // Use real owner data instead of static category mapping
  const user_owner = owner;

  // Favorite logic: sync with backend if logged in
  useEffect(() => {
    if (!item) return;
    
    if (isAuthenticated && userEmail) {
      fetch(`/api/users/${encodeURIComponent(userEmail)}/favorites`)
        .then(res => res.json())
        .then(data => {
          if (data.favorites && Array.isArray(data.favorites)) {
            setIsFavorite(data.favorites.includes(item.id))
          }
        })
    } else {
      // fallback to localStorage for guests
      if (typeof window !== "undefined") {
        const favs = localStorage.getItem("favorites")
        if (favs) {
          setIsFavorite(JSON.parse(favs).includes(item.id))
        }
      }
    }
  }, [isAuthenticated, userEmail, item?.id])

  const handleFavorite = async () => {
    if (!item) return;
    
    if (isAuthenticated && userEmail) {
      const method = isFavorite ? "DELETE" : "POST"
      await fetch(`/api/users/${encodeURIComponent(userEmail)}/favorites`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id })
      })
      setIsFavorite((prev) => !prev)
      // Notify other tabs/components for logged-in users
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("favorites-updated"))
      }
    } else {
      // fallback to localStorage for guests
      if (typeof window !== "undefined") {
        let favs = localStorage.getItem("favorites")
        let arr = favs ? JSON.parse(favs) : []
        if (isFavorite) {
          arr = arr.filter((id: string) => id !== item.id)
        } else {
          arr.push(item.id)
        }
        localStorage.setItem("favorites", JSON.stringify(arr))
        setIsFavorite((prev) => !prev)
      }
    }
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Item not found</h1>
          <p className="text-muted-foreground mb-6">The item you're looking for doesn't exist or has been removed.</p>
          <Link href="/items">
            <Button>Browse All Items</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8 lg:mb-12">
          <Link href="/" className="hover:text-primary transition-colors duration-200 font-medium text-foreground">Home</Link>
          <span className="text-muted-foreground">/</span>
          <Link href="/items" className="hover:text-primary transition-colors duration-200 font-medium text-foreground">Items</Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-semibold truncate">{item.title}</span>
        </nav>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-6">
            <div className="aspect-square relative overflow-hidden rounded-2xl shadow-2xl bg-card border border-border">
              <Image
                src={item.images[selectedImageIndex]}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </div>
            {item.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {item.images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                      selectedImageIndex === index 
                        ? 'border-primary ring-2 ring-primary/20 shadow-lg' 
                        : 'border-border hover:border-primary/30 shadow-sm'
                    }`}
                  >
                    <Image src={image} alt={`${item.title} ${index + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="space-y-8">
            {/* Title and Basic Info */}
            <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">{item.title}</h1>
                <div className="flex gap-2">
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
                      className={
                        isFavorite
                          ? "h-5 w-5 fill-red-500 text-red-600"
                          : "h-5 w-5 text-muted-foreground"
                      }
                      fill={isFavorite ? "#ef4444" : "none"}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="hover:bg-accent hover:border-primary/30 transition-all duration-200"
                    onClick={async () => {
                      const shareData = {
                        title: item.title,
                        text: item.description,
                        url: typeof window !== 'undefined' ? window.location.href : ''
                      };
                      if (navigator.share) {
                        try {
                          await navigator.share(shareData);
                        } catch (err) {
                          // User cancelled or error
                        }
                      } else if (navigator.clipboard) {
                        await navigator.clipboard.writeText(shareData.url);
                        toast({ title: "Link copied!", description: "Item link copied to clipboard." });
                      } else {
                        window.prompt("Copy this link:", shareData.url);
                      }
                    }}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center bg-muted px-3 py-2 rounded-lg">
                  <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-sm font-medium text-foreground">{item.location}</span>
                </div>
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
                  {item.category}
                </span>
              </div>
              
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-lg font-semibold">{item.description}</p>
            </div>

            {/* Contact Owner */}
            <div className="bg-card rounded-2xl p-6 shadow-lg border border-border hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <MessageCircle className="mr-2 h-5 w-5 text-primary" />
                Contact Owner
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  asChild 
                  variant="outline" 
                  className="flex-1 bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-200 text-green-800 hover:text-green-900 transition-all duration-200 rounded-xl py-3 h-12 font-medium shadow-sm hover:shadow-md" 
                  disabled={!user_owner?.whatsapp_number}
                >
                  <a href={`https://wa.me/${user_owner?.whatsapp_number?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp ({user_owner?.whatsapp_number || "Not available"})
                  </a>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="flex-1 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200 text-blue-800 hover:text-blue-900 transition-all duration-200 rounded-xl py-3 h-12 font-medium shadow-sm hover:shadow-md" 
                  disabled={!user_owner?.calling_number}
                >
                  <a href={`tel:${user_owner?.calling_number}`}> 
                    <Phone className="mr-2 h-4 w-4" />
                    Call ({user_owner?.calling_number || "Not available"})
                  </a>
                </Button>
              </div>
            </div>


          </div>
        </div>
        {/* Additional Information */}
        <div className="mt-12 space-y-8">
          {/* Owner Information */}
          <Card className="bg-card rounded-2xl shadow-lg border border-border hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl text-foreground">
                <User className="mr-3 h-6 w-6 text-primary" />
                Owner Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-6">
                <Avatar className="h-20 w-20 ring-4 ring-primary/20 shadow-lg">
                  <AvatarImage src={user_owner?.avatar || "/placeholder-user.jpg"} alt={user_owner?.name || "Owner"} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                    {user_owner?.name ? user_owner.name.split(' ').map((n: string) => n[0]).join('') : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{user_owner?.name || "Owner"}</h3>
                    {user_owner?.verified && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                        <Shield className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/80 mb-3">
                    <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
                      <Star className="h-4 w-4 text-yellow-500 mr-1 fill-current" />
                      <span className="font-semibold text-yellow-800">{user_owner?.rating ?? "-"}</span>
                      <span className="ml-1 text-yellow-700">({user_owner?.reviews ?? "-"} reviews)</span>
                    </div>
                    <span className="bg-muted px-2 py-1 rounded-lg font-medium">
                      Joined {user_owner?.createdAt ? new Date(user_owner.createdAt).toLocaleDateString() : "-"}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-foreground/80 bg-muted px-2 py-1 rounded-lg inline-flex">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    <span className="font-medium">Response time: {user_owner?.responseTime ?? "Not available"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Specifications */}
          <Card className="bg-card rounded-2xl shadow-lg border border-border hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-foreground">Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(item.specifications).map(([key, value]: [string, string]) => (
                  <div key={key} className="flex gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 min-w-0 flex-shrink-0">{key}:</span>
                    <span className="text-slate-800 dark:text-slate-200 min-w-0 font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* What's Included */}
          <Card className="bg-card rounded-2xl shadow-lg border border-border hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-foreground">What's Included</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {item.included.map((includedItem: string, index: number) => (
                  <li key={index} className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <span className="mr-3 text-green-600 font-bold text-lg">✓</span>
                    <span className="font-bold text-black">{includedItem}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Rental Rules */}
          <Card className="bg-card rounded-2xl shadow-lg border border-border hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-foreground">Rental Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {item.rules.map((rule: string, index: number) => (
                  <li key={index} className="flex items-start p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <span className="mr-3 mt-1 text-blue-600 font-bold">•</span>
                    <span className="font-bold text-black leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="bg-card rounded-2xl shadow-lg border border-border hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-foreground">Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {item.features.map((feature: string, index: number) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="px-4 py-2 text-sm bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-colors rounded-full"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rental Details */}
          <Card className="bg-card rounded-2xl shadow-lg border border-border hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-foreground">Rental Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-muted p-4 rounded-xl hover:bg-muted/80 transition-colors">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-primary" />
                    Availability
                  </h4>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    Available from <span className="font-semibold text-foreground">{new Date(item.available_from).toLocaleDateString()}</span> to{' '}
                    <span className="font-semibold text-foreground">{new Date(item.available_until).toLocaleDateString()}</span>
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-xl hover:bg-muted/80 transition-colors">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-primary" />
                    Rental Period
                  </h4>
                  <p className="text-sm text-foreground/80">
                    <span className="font-semibold text-foreground">Min:</span> {item.min_rental_days} day{item.min_rental_days > 1 ? 's' : ''} • 
                    <span className="font-semibold text-foreground ml-2">Max:</span> {item.max_rental_days} day{item.max_rental_days > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-xl hover:bg-muted/80 transition-colors">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-primary" />
                    Delivery Options
                  </h4>
                  <div className="space-y-2 text-sm text-foreground/80">
                    {item.delivery_available && (
                      <p className="flex items-center">
                        <span className="mr-2 text-green-600 font-bold">✓</span>
                        <span className="font-medium">Delivery available</span>
                      </p>
                    )}
                    {item.pickup_available && (
                      <p className="flex items-center">
                        <span className="mr-2 text-green-600 font-bold">✓</span>
                        <span className="font-medium">Pickup available</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-xl hover:bg-muted/80 transition-colors">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center">
                    <Shield className="mr-2 h-4 w-4 text-primary" />
                    Cancellation Policy
                  </h4>
                  <p className="text-sm text-foreground/80 font-medium">{item.cancellation_policy}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Calendar */}
          <Card className="bg-card rounded-2xl shadow-lg border border-border hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-foreground">Booking Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <BookingCalendar 
                itemId={item.id} 
                ownerEmail={item.owner_email}
                userEmail={user?.email}
                isOwner={user?.email === item.owner_email}
              />
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <div className="xl:col-span-2 space-y-6">
            {/* Rating Summary */}
            <Card className="bg-card rounded-2xl shadow-lg border border-border">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Reviews & Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                <RatingSummary itemId={item.id} key={reviewRefreshKey} />
              </CardContent>
            </Card>

            {/* Review Submission Form */}
            {user?.email && (
              <Card id="review" className="bg-card rounded-2xl shadow-lg border border-border">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground">Write a Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewSubmissionForm 
                    itemId={item.id} 
                    userEmail={user.email}
                    onReviewSubmitted={() => {
                      // Trigger a re-render of reviews by updating the refresh key
                      setReviewRefreshKey(prev => prev + 1);
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Reviews Display */}
            <Card className="bg-card rounded-2xl shadow-lg border border-border">
              <CardContent className="p-0">
                <ReviewsDisplay 
                  itemId={item.id} 
                  currentUserEmail={user?.email} 
                  key={reviewRefreshKey}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
