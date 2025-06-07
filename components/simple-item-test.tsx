"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export default function SimpleItemTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [location, setLocation] = useState("")
  const [debugInfo, setDebugInfo] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setDebugInfo("Starting form submission...")

    try {
      // Set up test user if not exists
      if (!localStorage.getItem('userEmail')) {
        localStorage.setItem('userEmail', 'test@example.com')
        localStorage.setItem('userName', 'Test User')
        setDebugInfo(prev => prev + "\n✅ Set up test user authentication")
      }

      // Validate required fields
      if (!title || !category || !description || !price || !location) {
        const missing: string[] = []
        if (!title) missing.push('title')
        if (!category) missing.push('category') 
        if (!description) missing.push('description')
        if (!price) missing.push('price')
        if (!location) missing.push('location')
        
        setDebugInfo(prev => prev + `\n❌ Missing fields: ${missing.join(', ')}`)
        toast({
          title: "Validation Error",
          description: `Missing required fields: ${missing.join(', ')}`,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      setDebugInfo(prev => prev + "\n✅ All required fields present")

      // Create item data
      const itemData = {
        title: title.trim(),
        category,
        description: description.trim(),
        price: parseFloat(price),
        location,
        owner_email: localStorage.getItem('userEmail'),
        images: ["/placeholder.svg?height=300&width=400"],
        specifications: {},
        features: [],
        included: [],
        rules: [],
        available_from: new Date().toISOString().split('T')[0],
        available_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        min_rental_days: 1,
        max_rental_days: 30,
        delivery_available: true,
        pickup_available: true,
        cancellation_policy: "Free cancellation up to 24 hours before rental",
        booked_dates: []
      }

      setDebugInfo(prev => prev + `\n📦 Item data prepared: ${JSON.stringify(itemData, null, 2)}`)

      // Make API call
      setDebugInfo(prev => prev + "\n🔄 Making API call...")
      
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      })

      setDebugInfo(prev => prev + `\n📡 API Response Status: ${response.status}`)

      if (!response.ok) {
        const errorData = await response.json()
        setDebugInfo(prev => prev + `\n❌ API Error: ${JSON.stringify(errorData, null, 2)}`)
        throw new Error(errorData.error || 'Failed to create item')
      }

      const newItem = await response.json()
      setDebugInfo(prev => prev + `\n✅ Item created successfully: ${JSON.stringify(newItem, null, 2)}`)

      toast({
        title: "Success!",
        description: "Item created successfully!",
      })

      // Reset form
      setTitle("")
      setCategory("")
      setDescription("")
      setPrice("")
      setLocation("")

    } catch (error) {
      setDebugInfo(prev => prev + `\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setDebugInfo(prev => prev + "\n🏁 Form submission completed")
    }
  }

  const handleTestAPI = async () => {
    setDebugInfo("Testing API connection...")
    try {
      const response = await fetch('/api/items')
      if (response.ok) {
        const items = await response.json()
        setDebugInfo(prev => prev + `\n✅ API connected successfully. Found ${items.length} items`)
      } else {
        setDebugInfo(prev => prev + `\n❌ API connection failed: ${response.status}`)
      }
    } catch (error) {
      setDebugInfo(prev => prev + `\n❌ API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Simple Item Creation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleTestAPI} variant="outline">
            Test API Connection
          </Button>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Test Gaming Laptop"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory} disabled={isLoading}>
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
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High-performance gaming laptop with RTX graphics"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price per day (₹) *</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="500"
                min="1"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Select value={location} onValueChange={setLocation} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mumbai, Maharashtra">Mumbai, Maharashtra</SelectItem>
                  <SelectItem value="Delhi, NCR">Delhi, NCR</SelectItem>
                  <SelectItem value="Bangalore, Karnataka">Bangalore, Karnataka</SelectItem>
                  <SelectItem value="Hyderabad, Telangana">Hyderabad, Telangana</SelectItem>
                  <SelectItem value="Chennai, Tamil Nadu">Chennai, Tamil Nadu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Creating Item..." : "Create Test Item"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
            {debugInfo || "No debug information yet. Click 'Test API Connection' or submit the form to see debug output."}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}