"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { DragDropUpload } from "@/components/ui/drag-drop-upload";
import { 
  User, 
  Bell, 
  Shield, 
  Eye, 
  Globe, 
  CreditCard, 
  Trash2, 
  Camera,
  Mail,
  Phone,
  MapPin,
  KeyRound
} from "lucide-react";

export default function SettingsPage() {
  const { user: authUser, logout, refreshUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // User profile data
  const [user, setUser] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: ""
  });
  
  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  
  // Modal states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // Loading states
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Fetch user data on component mount
  useEffect(() => {
    if (authUser?.email) {
      fetchUserData();
    }
  }, [authUser]);

  const fetchUserData = async () => {
    if (!authUser?.email) return;
    
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(authUser.email)}`);
      const data = await res.json();
      
      if (!data.error) {
        setUser(data);
        setProfileForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          bio: data.bio || ""
        });
        
        // Set privacy settings (from user data or defaults)
        setEmailNotifications(data.emailNotifications ?? true);
        setPushNotifications(data.pushNotifications ?? true);
        setProfileVisibility(data.profileVisibility ?? true);
        setShowEmail(data.showEmail ?? false);
        setShowPhone(data.showPhone ?? false);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Use fallback data from auth provider
      if (authUser) {
        setUser(authUser);
        setProfileForm({
          name: authUser.name || "",
          email: authUser.email || "",
          phone: authUser.phone || "",
          location: authUser.location || "",
          bio: ""
        });
      }
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.email) return;
    
    setProfileLoading(true);
    try {
      const updateData = {
        ...profileForm,
        avatar: user?.avatar, // Preserve current avatar
        emailNotifications,
        pushNotifications,
        profileVisibility,
        showEmail,
        showPhone
      };
      
      const res = await fetch(`/api/users/${encodeURIComponent(authUser.email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });
      
      if (res.ok) {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
        await fetchUserData(); // Refresh data
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authUser?.email) {
      toast({
        title: "Error",
        description: "User email not found.",
        variant: "destructive"
      });
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match.",
        variant: "destructive"
      });
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }
    
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authUser.email,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      
      if (res.ok) {
        toast({
          title: "Password updated",
          description: "Your password has been changed successfully.",
        });
        setShowPasswordDialog(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to update password");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = () => {
    setShowAvatarDialog(true);
  };

  const handleAvatarImagesChange = async (images: string[]) => {
    if (images.length === 0) return;

    const avatarUrl = images[0]; // Use the first image as profile photo
    setAvatarUploading(true);

    try {
      // Update user profile with new avatar
      if (!authUser?.email) {
        throw new Error("User email not found");
      }
      
      const updateRes = await fetch(`/api/users/${encodeURIComponent(authUser.email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profileForm,
          avatar: avatarUrl,
          emailNotifications,
          pushNotifications,
          profileVisibility,
          showEmail,
          showPhone
        })
      });

      if (updateRes.ok) {
        setUser({ ...user, avatar: avatarUrl });
        toast({
          title: "Profile photo updated",
          description: "Your profile photo has been updated successfully.",
        });
        setShowAvatarDialog(false);
        await fetchUserData(); // Refresh data
        await refreshUser(); // Update auth context so navbar shows new avatar immediately
      } else {
        throw new Error("Failed to update profile with new photo");
      }

    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload profile photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!authUser?.email) return;
    
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(authUser.email)}`, {
        method: "DELETE"
      });
      
      if (res.ok) {
        toast({
          title: "Account deleted",
          description: "Your account has been deleted successfully.",
        });
        logout();
        router.push("/");
      } else {
        throw new Error("Failed to delete account");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive"
      });
    }
    setShowDeleteDialog(false);
  };

  // Redirect if not authenticated
  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Settings</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !authUser) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Settings</h1>
          <p className="text-muted-foreground">Please log in to access your settings.</p>
          <Button 
            onClick={() => router.push("/login")} 
            className="mt-4"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and profile details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name || "User"} />
              <AvatarFallback className="text-2xl">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={handleAvatarUpload}
                disabled={avatarUploading}
              >
                <Camera className="h-4 w-4" />
                {avatarUploading ? "Uploading..." : "Change Photo"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, GIF or PNG. 2MB max.
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  placeholder="Enter your email"
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed
                </p>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={profileForm.location}
                  onChange={handleProfileChange}
                  placeholder="Enter your location"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                name="bio"
                value={profileForm.bio}
                onChange={handleProfileChange}
                placeholder="Tell others about yourself"
              />
            </div>

            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>
            Control who can see your information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Make your profile visible to other users
              </p>
            </div>
            <Switch
              checked={profileVisibility}
              onCheckedChange={setProfileVisibility}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Email Address</Label>
              <p className="text-sm text-muted-foreground">
                Display your email on your public profile
              </p>
            </div>
            <Switch
              checked={showEmail}
              onCheckedChange={setShowEmail}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Phone Number</Label>
              <p className="text-sm text-muted-foreground">
                Display your phone on your public profile
              </p>
            </div>
            <Switch
              checked={showPhone}
              onCheckedChange={setShowPhone}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates and alerts via email
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications on this device
              </p>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your account security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Password</Label>
              <p className="text-sm text-muted-foreground">
                Last updated 30 days ago
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowPasswordDialog(true)}
              className="flex items-center gap-2"
            >
              <KeyRound className="h-4 w-4" />
              Change Password
            </Button>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Two-Factor Authentication</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">Not Enabled</Badge>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security
                </p>
              </div>
            </div>
            <Button variant="outline" disabled>
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Delete Account</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one
          </DialogDescription>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPasswordDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete your account? This action cannot be undone.
            All your data, listings, and bookings will be permanently removed.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Yes, Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Avatar Upload Dialog */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Update Profile Photo</DialogTitle>
          <DialogDescription>
            Upload a new profile photo. Images will be automatically compressed and optimized.
          </DialogDescription>
          <div className="space-y-4">
            <DragDropUpload
              onImagesChange={handleAvatarImagesChange}
              maxFiles={1}
              maxSizeInMB={5}
              currentImages={user?.avatar ? [user.avatar] : []}
              enableCompression={true}
              enableImageEditing={true}
              compressionOptions={{
                maxWidth: 500,
                maxHeight: 500,
                quality: 0.9,
                format: 'jpeg'
              }}
              className="min-h-[200px]"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAvatarDialog(false)}
              disabled={avatarUploading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
