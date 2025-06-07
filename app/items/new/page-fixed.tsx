"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Upload, X, Plus, Trash2 } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { Checkbox } from "@/components/ui/checkbox"

function NewItemPageContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [category, setCategory] = useState("")
  const [subcategory, setSubcategory] = useState("")
  const [location, setLocation] = useState("")
  const [specifications, setSpecifications] = useState<Array<{key: string, value: string}>>([])
  const [features, setFeatures] = useState<string[]>([])
  const [included, setIncluded] = useState<string[]>([])
  const [rules, setRules] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState("")
  const [newIncluded, setNewIncluded] = useState("")
  const [newRule, setNewRule] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const indianCities = [
    "Mumbai, Maharashtra",
    "Delhi, NCR",
    "Bangalore, Karnataka",
    "Hyderabad, Telangana",
    "Chennai, Tamil Nadu",
    "Kolkata, West Bengal",
    "Pune, Maharashtra",
    "Ahmedabad, Gujarat",
    "Jaipur, Rajasthan",
    "Surat, Gujarat",
  ]

  const categorySubcategories: Record<string, string[]> = {
    "Electronics": ["Smartphones", "Cameras", "Laptops", "Gaming", "Audio", "Tablets", "Other Electronics"],
    "Vehicles": ["Cars", "Bikes", "Scooters", "Bicycles", "Other Vehicles"],
    "Sports": ["Cricket", "Football", "Basketball", "Tennis", "Cycling", "Fitness", "Other Sports"],
    "Tools": ["Power Tools", "Hand Tools", "Garden Tools", "Other Tools"],
    "Travel Gare": ["Luggage", "Camping", "Travel Accessories", "Other Travel"],
    "Furniture": ["Chairs", "Tables", "Storage", "Decor", "Other Furniture"],
    "Books": ["Fiction", "Non-Fiction", "Educational", "Children", "Other Books"],
    "Others": ["Other Items"]
  }

  const addSpecification = () => {
    setSpecifications([...specifications, { key: "", value: "" }])
  }

  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...specifications]
    updated[index][field] = value
    setSpecifications(updated)
  }

  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index))
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()])
      setNewFeature("")
    }
  }

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const addIncluded = () => {
    if (newIncluded.trim()) {
      setIncluded([...included, newIncluded.trim()])
      setNewIncluded("")
    }
  }

  const removeIncluded = (index: number) => {
    setIncluded(included.filter((_, i) => i !== index))
  }

  const addRule = () => {
    if (newRule.trim()) {
      setRules([...rules, newRule.trim()])
      setNewRule("")
    }
  }

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    console.log("🔍 Form submission started")
    console.log("🔍 Current state:", { category, subcategory, location })

    // Get form data
    const formData = new FormData(e.currentTarget)
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const price = Number.parseFloat(formData.get("price") as string)
    const minRentalDays = Number.parseInt(formData.get("minRentalDays") as string) || 1
    const maxRentalDays = Number.parseInt(formData.get("maxRentalDays") as string) || 30
    const availableFrom = formData.get("availableFrom") as string
    const availableUntil = formData.get("availableUntil") as string
    const cancellationPolicy = formData.get("cancellationPolicy") as string
    const deliveryAvailable = formData.get("deliveryAvailable") === "on"
    const pickupAvailable = formData.get("pickupAvailable") === "on"

    console.log("🔍 Form data:", { title, description, price, category, subcategory, location })

    // Validate required fields
    if (!title || !category || !description || !price || !location) {
      const missing: string[] = []
      if (!title) missing.push('title')
      if (!category) missing.push('category')
      if (!description) missing.push('description')
      if (!price) missing.push('price')
      if (!location) missing.push('location')
      
      console.log("❌ Missing fields:", missing)
      toast({
        title: "Error",
        description: `Please fill in all required fields: ${missing.join(', ')}`,
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Get user email from localStorage (auth system stores user object)
    const userDataString = localStorage.getItem('user')
    let userEmail = null
    
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString)
        userEmail = userData.email
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
    
    if (!userEmail) {
      toast({
        title: "Error",
        description: "Please log in to list an item.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      // Create specifications object
      const specsObj: Record<string, string> = {}
      specifications.forEach(spec => {
        if (spec.key.trim() && spec.value.trim()) {
          specsObj[spec.key.trim()] = spec.value.trim()
        }
      })

      // Create item data structure
      const itemData = {
        title: title.trim(),
        category,
        subcategory: subcategory || null,
        description: description.trim(),
        price,
        location,
        owner_email: userEmail,
        images: images.length > 0 ? images : ["/placeholder.svg?height=300&width=400"],
        specifications: specsObj,
        features: features.filter(f => f.trim()),
        included: included.filter(i => i.trim()),
        rules: rules.filter(r => r.trim()),
        available_from: availableFrom || new Date().toISOString().split('T')[0],
        available_until: availableUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        min_rental_days: minRentalDays,
        max_rental_days: maxRentalDays,
        delivery_available: deliveryAvailable,
        pickup_available: pickupAvailable,
        cancellation_policy: cancellationPolicy || "Free cancellation up to 24 hours before rental",
        booked_dates: []
      }

      console.log('Creating item with data:', itemData);

      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create item')
      }

      const newItem = await response.json()
      console.log('Item created successfully:', newItem);

      toast({
        title: "Item listed successfully!",
        description: "Your item is now available for others to rent across India.",
      })

      // Redirect to items page
      router.push("/items")
    } catch (error) {
      console.error('Error creating item:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.style.display = 'none';
    
    input.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      // Check if adding these files would exceed the limit
      if (images.length + files.length > 5) {
        toast({
          title: "Too many images",
          description: `You can only upload ${5 - images.length} more image${5 - images.length === 1 ? '' : 's'}.`,
          variant: "destructive",
        });
        return;
      }

      try {
        const formData = new FormData();
        Array.from(files).forEach(file => {
          // Validate file size (5MB max)
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`);
          }
          
          // Validate file type
          if (!file.type.startsWith('image/')) {
            throw new Error(`File ${file.name} is not an image.`);
          }
          
          formData.append('images', file);
        });
        
        formData.append('folder', 'rental-items');

        toast({
          title: "Uploading images...",
          description: "Please wait while we upload your images.",
        });

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();
        const newImageUrls = result.images.map((img: any) => img.url);
        
        setImages([...images, ...newImageUrls]);
        
        toast({
          title: "Images uploaded",
          description: `${files.length} image${files.length > 1 ? 's' : ''} uploaded successfully.`,
        });

      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to upload images. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }

  const handleImageRemove = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">List Your Item</h1>
      <p className="text-muted-foreground mb-8">
        Share your unused items with people in your city and earn money while helping others save.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Item Details */}
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
                <CardDescription>Provide information about the item you want to rent out</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Professional DSLR Camera"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={(value) => {
                      setCategory(value)
                      setSubcategory("") // Reset subcategory when category changes
                    }} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Vehicles">Vehicles</SelectItem>
                        <SelectItem value="Sports">Sports & Outdoors</SelectItem>
                        <SelectItem value="Tools">Tools & Equipment</SelectItem>
                        <SelectItem value="Travel Gare">Travel Gare</SelectItem>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="Books">Books & Education</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Subcategory</Label>
                    <Select value={subcategory} onValueChange={setSubcategory} disabled={!category}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {category && categorySubcategories[category]?.map((sub) => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe your item in detail, including condition, features, etc."
                    rows={5}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price per day (₹) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="500"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Select value={location} onValueChange={setLocation} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your city" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
                <CardDescription>Add technical details and specifications for your item</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {specifications.map((spec, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                    <div className="space-y-1">
                      <Label>Specification</Label>
                      <Input
                        placeholder="e.g., Brand, Model, Color"
                        value={spec.key}
                        onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Value</Label>
                      <Input
                        placeholder="e.g., Canon, EOS R5, Black"
                        value={spec.value}
                        onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeSpecification(index)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSpecification}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Specification
                </Button>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>List the key features of your item</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center bg-secondary px-3 py-1 rounded-full">
                      <span className="text-sm">{feature}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-auto p-0"
                        onClick={() => removeFeature(index)}
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter a feature"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addFeature}
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* What's Included */}
            <Card>
              <CardHeader>
                <CardTitle>What's Included</CardTitle>
                <CardDescription>List all items included with the rental</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {included.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-secondary px-3 py-2 rounded-lg">
                      <span className="text-sm">{item}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIncluded(index)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter an included item"
                    value={newIncluded}
                    onChange={(e) => setNewIncluded(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIncluded())}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addIncluded}
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Rental Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Rental Rules</CardTitle>
                <CardDescription>Set rules and guidelines for renting your item</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {rules.map((rule, index) => (
                    <div key={index} className="flex items-center justify-between bg-secondary px-3 py-2 rounded-lg">
                      <span className="text-sm">{rule}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRule(index)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter a rental rule"
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addRule}
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Rental Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Rental Terms</CardTitle>
                <CardDescription>Set availability and rental conditions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="availableFrom">Available From</Label>
                    <Input
                      id="availableFrom"
                      name="availableFrom"
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="availableUntil">Available Until</Label>
                    <Input
                      id="availableUntil"
                      name="availableUntil"
                      type="date"
                      defaultValue={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minRentalDays">Minimum Rental Days</Label>
                    <Input
                      id="minRentalDays"
                      name="minRentalDays"
                      type="number"
                      min="1"
                      defaultValue="1"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxRentalDays">Maximum Rental Days</Label>
                    <Input
                      id="maxRentalDays"
                      name="maxRentalDays"
                      type="number"
                      min="1"
                      defaultValue="30"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
                  <Select name="cancellationPolicy">
                    <SelectTrigger>
                      <SelectValue placeholder="Select cancellation policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Free cancellation up to 24 hours before rental">Free cancellation (24 hours)</SelectItem>
                      <SelectItem value="Free cancellation up to 48 hours before rental">Free cancellation (48 hours)</SelectItem>
                      <SelectItem value="Free cancellation up to 72 hours before rental">Free cancellation (72 hours)</SelectItem>
                      <SelectItem value="No cancellation allowed">No cancellation allowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="deliveryAvailable" name="deliveryAvailable" defaultChecked />
                    <Label htmlFor="deliveryAvailable">Delivery available</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="pickupAvailable" name="pickupAvailable" defaultChecked />
                    <Label htmlFor="pickupAvailable">Pickup available</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photos */}
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
                <CardDescription>Add photos of your item (up to 5 photos)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Item ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => handleImageRemove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-32 border-dashed"
                      onClick={handleImageUpload}
                      disabled={isLoading}
                    >
                      <Upload className="h-6 w-6 mr-2" />
                      Add Photo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview and Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    {images.length > 0 ? (
                      <img
                        src={images[0] || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-muted-foreground">No image uploaded</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">Your item will appear here</h3>
                    <p className="text-sm text-muted-foreground">
                      Fill out the form to see how your listing will look to potential renters.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Listing Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating listing..." : "List Item"}
                </Button>
                <Button type="button" variant="outline" className="w-full" disabled={isLoading}>
                  Save as Draft
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

export default function NewItemPage() {
  return (
    <ProtectedRoute>
      <NewItemPageContent />
    </ProtectedRoute>
  )
}
