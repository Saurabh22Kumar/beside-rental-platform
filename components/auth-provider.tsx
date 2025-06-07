"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  location?: string
  avatar?: string
  isVerified?: boolean
}

interface AuthContextType {
  user: User | null
  login: (user: User, token: string) => void
  logout: () => void
  refreshUser: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in on app start
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setIsLoading(false)
        return
      }

      // In a real app, verify token with backend
      // const response = await fetch('/api/auth/me', {
      //   headers: { Authorization: `Bearer ${token}` }
      // })

      // Simulate token verification
      const savedUser = localStorage.getItem("user")
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    } finally {
      setIsLoading(false)
    }
  }

  const login = (userData: User, token: string) => {
    setUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))
    localStorage.setItem("token", token)
    // Clear any guest favorites when a user logs in to prevent contamination
    localStorage.removeItem("favorites")
  }

  const refreshUser = async () => {
    if (!user?.email) return;
    
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const updatedUser = await response.json();
        if (updatedUser && !updatedUser.error) {
          const refreshedUserData = {
            id: user.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: user.role,
            phone: updatedUser.phone || "",
            location: updatedUser.location || "",
            avatar: updatedUser.avatar || "",
            isVerified: user.isVerified
          };
          setUser(refreshedUserData);
          localStorage.setItem("user", JSON.stringify(refreshedUserData));
        }
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    // Clear favorites localStorage to prevent sharing between users
    localStorage.removeItem("favorites")
    router.push("/")
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, isLoading, isAuthenticated }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
