"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Plus, MessageCircle, Calendar, Settings, LogOut, Menu, ChevronDown, Smartphone, Car, Dumbbell, Wrench, MapPin, Sofa, BookOpen, Heart, Package, Bell } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import NotificationDropdown from "@/components/notification-dropdown"

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const [favoriteCount, setFavoriteCount] = useState<number>(0);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [hasNewNotifications, setHasNewNotifications] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  // Only fetch favorite count for logged-in users
  useEffect(() => {
    if (!(isAuthenticated && user)) {
      // Reset favorite count when user logs out
      setFavoriteCount(0);
      return;
    }
    async function fetchFavoriteCount() {
      if (user?.email) {
        const res = await fetch(`/api/users/${encodeURIComponent(user.email)}/favorites`)
        const data = await res.json()
        setFavoriteCount(data.favorites?.length || 0)
      }
    }
    fetchFavoriteCount()
    // Listen for storage changes (if needed for logged-in users)
    function handleStorage(e: StorageEvent) {
      if (e.key === "favorites") {
        fetchFavoriteCount()
      }
    }
    // Listen for custom favorites-updated event
    function handleFavoritesUpdated() {
      fetchFavoriteCount()
    }
    window.addEventListener("storage", handleStorage)
    window.addEventListener("favorites-updated", handleFavoritesUpdated)
    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("favorites-updated", handleFavoritesUpdated)
    }
  }, [user, isAuthenticated])

  // Fetch notification count and check for new notifications
  useEffect(() => {
    if (!(isAuthenticated && user?.email)) {
      setNotificationCount(0);
      setHasNewNotifications(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/notifications?ownerEmail=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const data = await res.json();
          const newCount = data.pendingCount || 0;
          
          // Check if there are new notifications
          if (newCount > notificationCount && notificationCount > 0) {
            setHasNewNotifications(true);
            // Auto-hide the new notification indicator after 5 seconds
            setTimeout(() => setHasNewNotifications(false), 5000);
          }
          
          setNotificationCount(newCount);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    // Listen for booking updates to refresh notifications
    const handleBookingUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener("booking-updated", handleBookingUpdate);
    window.addEventListener("notification-read", handleBookingUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("booking-updated", handleBookingUpdate);
      window.removeEventListener("notification-read", handleBookingUpdate);
    };
  }, [user, isAuthenticated, notificationCount]);

  // Handle notification click to reset new notification indicator
  const handleNotificationClick = () => {
    setHasNewNotifications(false);
  };

  // Helper to check if a link is active
  const isActive = (href: string) => pathname === href

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Beside
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/items/electronics" className={`text-sm font-medium flex items-center gap-1 transition-colors ${isActive("/items/electronics") ? "bg-accent text-accent-foreground rounded-md px-3 py-1" : "hover:text-primary"}`}>
              <Smartphone className="h-4 w-4" />
              Electronics
            </Link>
            <Link href="/items/vehicles" className={`text-sm font-medium flex items-center gap-1 transition-colors ${isActive("/items/vehicles") ? "bg-accent text-accent-foreground rounded-md px-3 py-1" : "hover:text-primary"}`}>
              <Car className="h-4 w-4" />
              Vehicles
            </Link>
            <Link href="/items/sports" className={`text-sm font-medium flex items-center gap-1 transition-colors ${isActive("/items/sports") ? "bg-accent text-accent-foreground rounded-md px-3 py-1" : "hover:text-primary"}`}>
              <Dumbbell className="h-4 w-4" />
              Sports
            </Link>
            <Link href="/items/tools" className={`text-sm font-medium flex items-center gap-1 transition-colors ${isActive("/items/tools") ? "bg-accent text-accent-foreground rounded-md px-3 py-1" : "hover:text-primary"}`}>
              <Wrench className="h-4 w-4" />
              Tools
            </Link>
            <Link href="/items/book" className={`text-sm font-medium flex items-center gap-1 transition-colors ${isActive("/items/book") ? "bg-accent text-accent-foreground rounded-md px-3 py-1" : "hover:text-primary"}`}>
              <BookOpen className="h-4 w-4" />
              Book
            </Link>
            <Link href="/items/travel-gare" className={`text-sm font-medium flex items-center gap-1 transition-colors ${isActive("/items/travel-gare") ? "bg-accent text-accent-foreground rounded-md px-3 py-1" : "hover:text-primary"}`}>
              <MapPin className="h-4 w-4" />
              Travel Gare
            </Link>
            <Link href="/items/furniture" className={`text-sm font-medium flex items-center gap-1 transition-colors ${isActive("/items/furniture") ? "bg-accent text-accent-foreground rounded-md px-3 py-1" : "hover:text-primary"}`}>
              <Sofa className="h-4 w-4" />
              Furniture
            </Link>
            <Link href="/items/others" className={`text-sm font-medium flex items-center gap-1 transition-colors ${isActive("/items/others") ? "bg-accent text-accent-foreground rounded-md px-3 py-1" : "hover:text-primary"}`}>
              <Package className="h-4 w-4" />
              Others
            </Link>
            {/* Removed Favorites from left side */}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Favorites Icon - only show for logged-in users */}
          {isAuthenticated && user && (
            <Link href="/favorites" aria-label="Favorites" className="relative group">
              <Heart className="h-6 w-6 text-red-500 group-hover:scale-110 transition-transform" />
              {favoriteCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-bold border border-white shadow">
                  {favoriteCount}
                </span>
              )}
            </Link>
          )}
          
          {/* Notification Link - only show for logged-in users */}
          {isAuthenticated && user && (
            <Link 
              href="/notifications" 
              aria-label="Notifications" 
              className="relative group"
              onClick={handleNotificationClick}
            >
              <div className="relative">
                <Bell 
                  className={`h-6 w-6 text-blue-500 group-hover:scale-110 transition-all duration-200 ${
                    hasNewNotifications 
                      ? 'animate-pulse text-blue-600 drop-shadow-lg' 
                      : ''
                  }`} 
                />
                {notificationCount > 0 && (
                  <span 
                    className={`absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-bold border border-white shadow transition-all duration-200 ${
                      hasNewNotifications 
                        ? 'animate-bounce bg-red-600 scale-110' 
                        : ''
                    }`}
                  >
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
                {hasNewNotifications && (
                  <div className="absolute -inset-1 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
                )}
              </div>
            </Link>
          )}
          {isAuthenticated && user ? (
            <>
              <Button asChild variant="outline" size="sm" className="hidden md:flex">
                <Link href="/items/new">
                  <Plus className="h-4 w-4 mr-2" />
                  List Item
                </Link>
              </Button>

              <div className="relative" ref={dropdownRef}>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full" onClick={() => setIsDropdownOpen((v) => !v)}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name || "User"} />
                    <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
                {isDropdownOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-56 rounded-md bg-background shadow-lg">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user?.name || "User"}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{user?.email || ""}</p>
                      </div>
                    </div>
                    <div className="border-t" />
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-muted" onClick={() => setIsDropdownOpen(false)}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                    <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-muted" onClick={() => setIsDropdownOpen(false)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                    <Link href="/my-items" className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-muted" onClick={() => setIsDropdownOpen(false)}>
                      <Calendar className="mr-2 h-4 w-4" />
                      My Items
                    </Link>
                    <Link href="/booking-history" className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-muted" onClick={() => setIsDropdownOpen(false)}>
                      <Package className="mr-2 h-4 w-4" />
                      Booking History
                    </Link>
                    <div className="border-t" />
                    <button onClick={() => { logout(); setIsDropdownOpen(false) }} className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-muted">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <div className="mb-2 font-semibold text-muted-foreground">Browse Categories</div>
            <Link href="/items/electronics" className="block py-2 text-sm flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}><Smartphone className="h-4 w-4" />Electronics</Link>
            <Link href="/items/vehicles" className="block py-2 text-sm flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}><Car className="h-4 w-4" />Vehicles</Link>
            <Link href="/items/sports" className="block py-2 text-sm flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}><Dumbbell className="h-4 w-4" />Sports</Link>
            <Link href="/items/tools" className="block py-2 text-sm flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}><Wrench className="h-4 w-4" />Tools</Link>
            <Link href="/items/book" className="block py-2 text-sm flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}><BookOpen className="h-4 w-4" />Book</Link>
            <Link href="/items/travel-gare" className="block py-2 text-sm flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}><MapPin className="h-4 w-4" />Travel Gare</Link>
            <Link href="/items/furniture" className="block py-2 text-sm flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}><Sofa className="h-4 w-4" />Furniture</Link>
            <Link href="/items/others" className="block py-2 text-sm flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}><Package className="h-4 w-4" />Others</Link>
            <div className="mt-4 border-t pt-4 space-y-2">
              {isAuthenticated && (
                <>
                  <Link href="/items/new" className="block py-2 text-sm flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>List Item</Link>
                  <Link href="/booking-history" className="block py-2 text-sm flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}><Package className="h-4 w-4" />Booking History</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
