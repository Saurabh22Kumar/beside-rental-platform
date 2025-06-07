"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserReviews from "@/components/user-reviews";
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Star,
  Clock,
  Settings,
  Eye,
  Package,
  Heart,
  MessageCircle,
  TrendingUp,
  Award,
  Shield,
  Edit3,
  Activity,
  BarChart3
} from "lucide-react";

export default function ProfilePage() {
  const { user: authUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalListings: 0,
    totalBookings: 0,
    totalFavorites: 0,
    rating: 0,
    reviews: 0,
    profileViews: 0,
    responseRate: 95,
    joinedDays: 0
  });
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: "listing", action: "Listed new item", item: "Gaming Chair", date: "2 days ago", icon: Package },
    { id: 2, type: "favorite", action: "Added to favorites", item: "MacBook Pro", date: "1 week ago", icon: Heart },
    { id: 3, type: "review", action: "Received a review", item: "5 stars", date: "2 weeks ago", icon: Star }
  ]);

  // Debug auth status
  useEffect(() => {
  }, [authUser, authLoading, isAuthenticated]);

  useEffect(() => {
    if (authUser?.email) {
      fetchUserData();
      fetchUserStats();
    }
  }, [authUser]);

  const fetchUserData = async () => {
    if (!authUser?.email) return;
    
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(authUser.email)}`);
      const data = await res.json();
      
      if (!data.error) {
        setUser(data);
        // Calculate days since joining
        const joinDate = new Date(data.createdAt);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - joinDate.getTime()) / (1000 * 3600 * 24));
        setStats(prev => ({ ...prev, joinedDays: daysDiff }));
      } else {
        console.error("API error:", data.error);
        // Set fallback user object
        setUser({
          email: authUser.email,
          name: authUser.name || "",
          phone: authUser.phone || "",
          location: authUser.location || "",
          bio: "",
          rating: 0,
          reviews: 0,
          verified: false,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      // Set fallback user object
      if (authUser) {
        setUser({
          email: authUser.email,
          name: authUser.name || "",
          phone: authUser.phone || "",
          location: authUser.location || "",
          bio: "",
          rating: 0,
          reviews: 0,
          verified: false,
          createdAt: new Date().toISOString()
        });
      }
    }
  };

  const fetchUserStats = async () => {
    if (!authUser?.email) return;
    
    try {
      // Fetch user's favorites count
      const favRes = await fetch(`/api/users/${encodeURIComponent(authUser.email)}/favorites`);
      const favData = await favRes.json();
      
      // For now, we'll use mock data for other stats since we don't have those APIs yet
      setStats(prev => ({
        ...prev,
        totalListings: 3, // Mock data
        totalBookings: 7, // Mock data
        totalFavorites: favData.favorites?.length || 0,
        rating: user?.rating || 4.8, // Mock data
        reviews: user?.reviews || 12, // Mock data
        profileViews: 156, // Mock data
        responseRate: 95
      }));
    } catch (error) {
      console.error("Error fetching user stats:", error);
      // Set mock stats for demonstration
      setStats(prev => ({
        ...prev,
        totalListings: 3,
        totalBookings: 7,
        totalFavorites: 5,
        rating: 4.8,
        reviews: 12,
        profileViews: 156,
        responseRate: 95
      }));
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !authUser) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center min-h-[400px] flex items-center justify-center">
          <div>
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
            <p className="text-muted-foreground mb-6">Please log in to view your profile.</p>
            <Button onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name || "User"} />
            <AvatarFallback className="text-2xl font-semibold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{user?.name}</h1>
              {user?.verified && (
                <Badge variant="secondary" className="text-green-600">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {user?.email}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Joined {new Date(user?.createdAt).toLocaleDateString()}
              </div>
              {user?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {user.location}
                </div>
              )}
            </div>
            {user?.rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{user.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({user?.reviews || 0} reviews)
                </span>
              </div>
            )}
            {user?.bio && (
              <p className="text-muted-foreground max-w-md">{user.bio}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push("/settings")}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button 
            onClick={() => router.push("/settings")}
            className="flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.totalListings}</p>
                <p className="text-sm text-muted-foreground">Active Listings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.totalFavorites}</p>
                <p className="text-sm text-muted-foreground">Favorites</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.profileViews}</p>
                <p className="text-sm text-muted-foreground">Profile Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.rating}</p>
                <p className="text-sm text-muted-foreground">Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number</label>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {user?.phone || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Response Time</label>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Usually within 2 hours
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Response Rate</label>
                    <div className="flex items-center gap-3">
                      <Progress value={stats.responseRate} className="flex-1" />
                      <span className="text-sm font-medium">{stats.responseRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your listings and activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2" 
                      onClick={() => router.push("/items/new")}
                    >
                      <Package className="h-6 w-6" />
                      List New Item
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2" 
                      onClick={() => router.push("/my-items")}
                    >
                      <Eye className="h-6 w-6" />
                      My Listings
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2" 
                      onClick={() => router.push("/favorites")}
                    >
                      <Heart className="h-6 w-6" />
                      Favorites
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2"
                      disabled
                    >
                      <MessageCircle className="h-6 w-6" />
                      Messages
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Verified</span>
                    <Badge variant={user?.verified ? "default" : "secondary"}>
                      {user?.verified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Profile Visibility</span>
                    <Badge variant="default">Public</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Member Since</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.joinedDays} days ago
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Profile Complete</p>
                      <p className="text-xs text-muted-foreground">Filled out all profile information</p>
                    </div>
                  </div>
                  {user?.verified && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Shield className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Verified Member</p>
                        <p className="text-xs text-muted-foreground">Account verified successfully</p>
                      </div>
                    </div>
                  )}
                  {stats.totalListings > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Package className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">First Listing</p>
                        <p className="text-xs text-muted-foreground">Created your first item listing</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <UserReviews userEmail={user?.email} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest actions on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const IconComponent = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="p-2 bg-muted rounded-full">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.item}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{activity.date}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Profile Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Profile Views</span>
                    <span className="font-medium">{stats.profileViews}</span>
                  </div>
                  <Progress value={75} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Response Rate</span>
                    <span className="font-medium">{stats.responseRate}%</span>
                  </div>
                  <Progress value={stats.responseRate} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>User Rating</span>
                    <span className="font-medium">{stats.rating}/5.0</span>
                  </div>
                  <Progress value={(stats.rating / 5) * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <Package className="h-12 w-12 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold">{stats.totalListings}</p>
                  <p className="text-sm text-muted-foreground">Total Listings</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-xl font-bold">{stats.totalFavorites}</p>
                    <p className="text-xs text-muted-foreground">Favorites</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-xl font-bold">{stats.reviews}</p>
                    <p className="text-xs text-muted-foreground">Reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
