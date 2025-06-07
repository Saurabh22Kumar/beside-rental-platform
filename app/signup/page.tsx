"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Eye, EyeOff } from "lucide-react"

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const { login, isAuthenticated } = useAuth()

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push("/")
    return null
  }

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
    "Lucknow, Uttar Pradesh",
    "Kanpur, Uttar Pradesh",
    "Nagpur, Maharashtra",
    "Indore, Madhya Pradesh",
    "Thane, Maharashtra",
    "Bhopal, Madhya Pradesh",
    "Visakhapatnam, Andhra Pradesh",
    "Pimpri-Chinchwad, Maharashtra",
    "Patna, Bihar",
    "Vadodara, Gujarat",
  ]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setLocalError("")

    // Get form data
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const whatsapp = formData.get("whatsapp") as string
    const calling = formData.get("calling") as string
    const location = formData.get("location") as string
    const role = formData.get("role") as string

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, whatsapp, calling, location, role }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Signup failed")
      }
      // Simulate successful signup
      const userData = {
        id: "user-" + Date.now(),
        name,
        email,
        role,
        whatsapp,
        calling,
        location,
        isVerified: false,
      }
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Mock JWT token
      login(userData, token)
      toast({
        title: "Account created successfully!",
        description: "Welcome to Beside India! You can now start renting and listing items.",
      })
      router.push("/")
    } catch (error: any) {
      setLocalError(error.message || "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Join Beside India</CardTitle>
            <CardDescription>Create an account to start renting and listing items across India</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            {localError && (
              <div className="mb-4 p-3 rounded bg-red-100 text-red-700 border border-red-300 text-center">
                {localError}
              </div>
            )}
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="Arjun Sharma" required disabled={isLoading} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="arjun@example.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input id="whatsapp" name="whatsapp" type="tel" placeholder="+91 9876543210" required disabled={isLoading} />
                <p className="text-xs text-muted-foreground">This will be used for rental communications</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="calling">Calling Number</Label>
                <Input id="calling" name="calling" type="tel" placeholder="+91 9876543210" required disabled={isLoading} />
                <p className="text-xs text-muted-foreground">Primary contact number for urgent matters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">City</Label>
                <Select name="location" required>
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

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>I want to:</Label>
                <RadioGroup defaultValue="both" name="role">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both">Rent & Lend Items</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="renter" id="renter" />
                    <Label htmlFor="renter">Only Rent Items</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lender" id="lender" />
                    <Label htmlFor="lender">Only Lend Items</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Log in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
