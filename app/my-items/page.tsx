"use client"

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useImageUpload } from "@/hooks/use-image-upload";
import { DragDropUpload } from "@/components/ui/drag-drop-upload";
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  DollarSign,
  Filter,
  Search,
  MoreHorizontal,
  TrendingUp,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  X
} from "lucide-react";
import Image from "next/image";
import CalendarManager from "@/components/calendar-manager";
import BookingCalendar from "@/components/booking-calendar";

interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  location: string;
  owner_email: string;
  images: string[];
  specifications?: Record<string, string>;
  features?: string[];
  included?: string[];
  rules?: string[];
  available_from?: string;
  available_until?: string;
  min_rental_days?: number;
  max_rental_days?: number;
  delivery_available?: boolean;
  pickup_available?: boolean;
  cancellation_policy?: string;
  booked_dates?: string[];
  created_at: string;
  updated_at?: string;
  rating?: number;
  reviews_count?: number;
  status: 'active' | 'paused' | 'booked';
  views: number;
}

export default function MyItemsPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newBookedDates, setNewBookedDates] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const { uploadImages, uploadSingleImage, uploading } = useImageUpload();
  
  // Edit form state - matching actual database schema
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    price: 0,
    location: "",
    features: [] as string[],
    specifications: {} as Record<string, string>,
    included: [] as string[],
    rules: [] as string[],
    available_from: "",
    available_until: "",
    min_rental_days: 1,
    max_rental_days: 7,
    delivery_available: false,
    pickup_available: false,
    cancellation_policy: "Flexible"
  });
  const [editImages, setEditImages] = useState<string[]>([]);
  
  const [stats, setStats] = useState({
    totalItems: 0,
    activeItems: 0,
    totalViews: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    if (user?.email) {
      fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(user.email)}/items`);
      const data = await res.json();
      
      if (data.items) {
        // Transform items to include mock data for demonstration
        const transformedItems = data.items.map((item: any) => ({
          ...item,
          status: item.booked_dates?.length > 0 ? 'booked' : 'active',
          views: Math.floor(Math.random() * 50) + 10, // Mock views
        }));
        
        setItems(transformedItems);
        
        // Calculate stats
        const totalViews = transformedItems.reduce((sum: number, item: Item) => sum + item.views, 0);
        const activeItems = transformedItems.filter((item: Item) => item.status === 'active').length;
        
        setStats({
          totalItems: transformedItems.length,
          activeItems,
          totalViews,
          totalEarnings: transformedItems.length * 150 // Mock earnings
        });
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      toast({
        title: "Error",
        description: "Failed to load your items. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookingUpdate = async () => {
    if (!selectedItem) return;
    
    try {
      const dates = newBookedDates.split(",").map(d => d.trim()).filter(Boolean);
      
      const res = await fetch(`/api/items/${selectedItem.id}/booked-dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates })
      });
      
      if (res.ok) {
        toast({
          title: "Success",
          description: "Booking dates updated successfully.",
        });
        fetchItems(); // Refresh the list
        setShowBookingDialog(false);
        setNewBookedDates("");
        setSelectedItem(null);
        
        // Notify other pages about the update
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("booking-dates-updated"));
        }
      } else {
        throw new Error("Failed to update booking dates");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update booking dates. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/items/${selectedItem.id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        toast({
          title: "Success",
          description: `"${selectedItem.title}" has been deleted successfully.`,
        });
        fetchItems(); // Refresh the list
        setShowDeleteDialog(false);
        setSelectedItem(null);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete item");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditItem = (item: Item) => {
    setSelectedItem(item);
    setEditForm({
      title: item.title,
      description: item.description,
      category: item.category,
      subcategory: item.subcategory || "",
      price: item.price,
      location: item.location,
      features: item.features || [],
      specifications: item.specifications || {},
      included: item.included || [],
      rules: item.rules || [],
      available_from: item.available_from || "",
      available_until: item.available_until || "",
      min_rental_days: item.min_rental_days || 1,
      max_rental_days: item.max_rental_days || 7,
      delivery_available: item.delivery_available || false,
      pickup_available: item.pickup_available || false,
      cancellation_policy: item.cancellation_policy || "Flexible"
    });
    setEditImages(item.images || []);
    setShowEditDialog(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setEditLoading(true);
    try {
      const updateData = {
        ...editForm,
        images: editImages
      };

      const res = await fetch(`/api/items/${selectedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Item updated successfully.",
        });
        fetchItems(); // Refresh the list
        setShowEditDialog(false);
        setSelectedItem(null);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update item");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddImages = (newImages: string[]) => {
    setEditImages(newImages);
    
    if (newImages.length > editImages.length) {
      const addedCount = newImages.length - editImages.length;
      toast({
        title: "Images uploaded",
        description: `${addedCount} image(s) uploaded successfully.`,
      });
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(items.map(item => item.category))];

  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your items...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center min-h-[400px] flex items-center justify-center">
          <div>
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
            <p className="text-muted-foreground mb-6">Please log in to view your items.</p>
            <Button onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your items...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Items</h1>
          <p className="text-muted-foreground">Manage your rental listings and bookings</p>
        </div>
        <Button onClick={() => router.push("/items/new")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          List New Item
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.totalItems}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.activeItems}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{stats.totalViews}</p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">₹{stats.totalEarnings}</p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No items found</h3>
              <p className="text-muted-foreground mb-6">
                {items.length === 0 
                  ? "You haven't listed any items yet. Start by creating your first listing!"
                  : "No items match your current filters. Try adjusting your search criteria."
                }
              </p>
              {items.length === 0 && (
                <Button onClick={() => router.push("/items/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  List Your First Item
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <Image
                    src={item.images?.[0] || "/placeholder.jpg"}
                    alt={item.title}
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />

                  <div className="absolute top-2 left-2">
                    <span className="text-xs bg-white/90 text-gray-800 px-2 py-1 rounded-md border border-gray-200 flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {item.views}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600">₹{item.price}/day</span>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {item.booked_dates && item.booked_dates.length > 0 && (
                    <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Booked: {item.booked_dates.length} date(s)
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => router.push(`/items/${item.id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item);
                        setNewBookedDates(item.booked_dates?.join(", ") || "");
                        setShowBookingDialog(true);
                      }}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Manage
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditItem(item)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowDeleteDialog(true);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedItem?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteItem}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Management Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Bookings & Calendar</DialogTitle>
            <DialogDescription>
              Manage booking requests and availability calendar for "{selectedItem?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedItem && (
              <>
                {/* Single Unified Calendar */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Booking Calendar</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    View and manage booking requests for your item
                  </p>
                  <div className="transform scale-90 origin-top-left" style={{ width: '111%' }}>
                    <BookingCalendar 
                      itemId={selectedItem.id}
                      ownerEmail={user?.email || ""}
                      userEmail={user?.email}
                      isOwner={true}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update your item details and images
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditFormChange}
                  placeholder="What are you renting out?"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  placeholder="Describe your item in detail..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select 
                    value={editForm.category} 
                    onValueChange={(value) => setEditForm(prev => ({...prev, category: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="vehicles">Vehicles</SelectItem>
                      <SelectItem value="tools">Tools & Equipment</SelectItem>
                      <SelectItem value="sports">Sports & Recreation</SelectItem>
                      <SelectItem value="clothing">Clothing & Accessories</SelectItem>
                      <SelectItem value="books">Books & Media</SelectItem>
                      <SelectItem value="home">Home & Garden</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-price">Price per day (₹) *</Label>
                  <Input
                    id="edit-price"
                    name="price"
                    type="number"
                    value={editForm.price}
                    onChange={handleEditFormChange}
                    placeholder="0"
                    min="0"
                    step="1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-location">Location *</Label>
                <Input
                  id="edit-location"
                  name="location"
                  value={editForm.location}
                  onChange={handleEditFormChange}
                  placeholder="Where is the item located?"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-min-rental">Min Rental Days</Label>
                  <Input
                    id="edit-min-rental"
                    name="min_rental_days"
                    type="number"
                    value={editForm.min_rental_days}
                    onChange={handleEditFormChange}
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-max-rental">Max Rental Days</Label>
                  <Input
                    id="edit-max-rental"
                    name="max_rental_days"
                    type="number"
                    value={editForm.max_rental_days}
                    onChange={handleEditFormChange}
                    placeholder="7"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-delivery-available"
                    name="delivery_available"
                    checked={editForm.delivery_available}
                    onChange={(e) => setEditForm(prev => ({...prev, delivery_available: e.target.checked}))}
                  />
                  <Label htmlFor="edit-delivery-available">Delivery Available</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-pickup-available"
                    name="pickup_available"
                    checked={editForm.pickup_available}
                    onChange={(e) => setEditForm(prev => ({...prev, pickup_available: e.target.checked}))}
                  />
                  <Label htmlFor="edit-pickup-available">Pickup Available</Label>
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div className="space-y-4">
              <Label>Images</Label>
              <DragDropUpload
                onImagesChange={handleAddImages}
                maxFiles={10}
                maxSizeInMB={5}
                currentImages={editImages}
                enableCompression={true}
                enableImageEditing={true}
                compressionOptions={{
                  maxWidth: 1920,
                  maxHeight: 1080,
                  quality: 0.85,
                  format: 'jpeg'
                }}
                className="min-h-[200px]"
              />
            </div>
          </form>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditSubmit}
              disabled={editLoading}
            >
              {editLoading ? "Updating..." : "Update Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
