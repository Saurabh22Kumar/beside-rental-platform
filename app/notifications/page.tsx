"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Calendar, CheckCircle, XCircle, Clock, User, Package, ArrowLeft, Phone, MapPin } from "lucide-react";
import { format } from "date-fns";

interface NotificationBooking {
  id: string;
  item_id: string;
  item_title: string;
  item_price: number;
  item_location: string;
  renter_email: string;
  renter_name?: string;
  renter_phone?: string;
  owner_email: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  total_days: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function NotificationsPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState<NotificationBooking[]>([]);
  const [myBookingRequests, setMyBookingRequests] = useState<NotificationBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    if (user?.email) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user?.email) return;
    
    try {
      setIsLoading(true);
      
      // Fetch pending requests for items I own
      const pendingResponse = await fetch(`/api/notifications?ownerEmail=${encodeURIComponent(user.email)}`);
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingRequests(pendingData.notifications || []);
      }

      // Fetch my booking requests (both pending and completed)
      const myRequestsResponse = await fetch(`/api/notifications?requesterEmail=${encodeURIComponent(user.email)}`);
      if (myRequestsResponse.ok) {
        const myRequestsData = await myRequestsResponse.json();
        setMyBookingRequests(myRequestsData.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'confirmed' | 'rejected') => {
    try {
      const booking = pendingRequests.find(b => b.id === bookingId);
      if (!booking) return;

      const response = await fetch(`/api/items/${booking.item_id}/bookings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          status: action,
          ownerEmail: user?.email
        }),
      });

      if (response.ok) {
        // Refresh notifications
        fetchNotifications();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const booking = [...pendingRequests, ...myBookingRequests].find(b => b.id === bookingId);
      if (!booking) return;

      const response = await fetch(`/api/items/${booking.item_id}/bookings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          status: 'cancelled',
          userEmail: user?.email,
          ownerEmail: booking.owner_email
        }),
      });

      if (response.ok) {
        // Refresh notifications
        fetchNotifications();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Confirmed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
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
            <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
            <p className="text-muted-foreground mb-6">Please log in to view your notifications.</p>
            <Button onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Notifications
            </h1>
            <p className="text-muted-foreground">Manage your booking requests and notifications</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Requests 
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-requests" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My Requests
            {myBookingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1">{myBookingRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests Tab - Items I own that have pending booking requests */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Pending Booking Requests
              </CardTitle>
              <CardDescription>
                Requests from users who want to book your items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                  <p className="text-muted-foreground">
                    You don't have any pending booking requests at the moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((booking) => (
                    <Card key={booking.id} className="border-l-4 border-l-yellow-400">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{booking.item_title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {booking.item_location} • ₹{booking.item_price}/day
                                </p>
                              </div>
                              {getStatusBadge(booking.status)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-sm text-muted-foreground">BOOKING DETAILS</h4>
                                <div className="mt-1 space-y-1">
                                  <p className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4" />
                                    {format(new Date(booking.start_date), 'MMM dd, yyyy')} - {format(new Date(booking.end_date), 'MMM dd, yyyy')}
                                  </p>
                                  <p className="text-sm">
                                    <span className="font-medium">{booking.total_days} day{booking.total_days > 1 ? 's' : ''}</span> • ₹{booking.total_amount}
                                  </p>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-sm text-muted-foreground">REQUESTER</h4>
                                <div className="mt-1 space-y-1">
                                  <p className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4" />
                                    {booking.renter_name || booking.renter_email}
                                  </p>
                                  {booking.renter_phone && (
                                    <p className="flex items-center gap-2 text-sm">
                                      <Phone className="h-4 w-4" />
                                      {booking.renter_phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {booking.notes && (
                              <div>
                                <h4 className="font-medium text-sm text-muted-foreground">NOTES</h4>
                                <p className="text-sm mt-1 italic">"{booking.notes}"</p>
                              </div>
                            )}

                            <div className="text-xs text-muted-foreground">
                              Requested on {format(new Date(booking.created_at), 'MMM dd, yyyy \'at\' HH:mm')}
                            </div>
                          </div>
                        </div>

                        {booking.status === 'pending' && (
                          <div className="flex gap-2 mt-4 pt-4 border-t">
                            <Button
                              onClick={() => handleBookingAction(booking.id, 'confirmed')}
                              className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Accept Request
                            </Button>
                            <Button
                              onClick={() => handleBookingAction(booking.id, 'rejected')}
                              variant="outline"
                              className="flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject Request
                            </Button>
                            <Button
                              onClick={() => handleCancelBooking(booking.id)}
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Requests Tab - My booking requests to other users' items */}
        <TabsContent value="my-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                My Booking Requests
              </CardTitle>
              <CardDescription>
                Your booking requests and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : myBookingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No booking requests</h3>
                  <p className="text-muted-foreground">
                    You haven't made any booking requests yet.
                  </p>
                  <Button 
                    onClick={() => router.push('/')} 
                    className="mt-4"
                  >
                    Browse Items
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myBookingRequests.map((booking) => (
                    <Card key={booking.id} className={`border-l-4 ${
                      booking.status === 'pending' ? 'border-l-yellow-400' :
                      booking.status === 'confirmed' ? 'border-l-green-400' :
                      booking.status === 'rejected' ? 'border-l-red-400' :
                      'border-l-gray-400'
                    }`}>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{booking.item_title}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {booking.item_location} • ₹{booking.item_price}/day
                              </p>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground">BOOKING DETAILS</h4>
                              <div className="mt-1 space-y-1">
                                <p className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4" />
                                  {format(new Date(booking.start_date), 'MMM dd, yyyy')} - {format(new Date(booking.end_date), 'MMM dd, yyyy')}
                                </p>
                                <p className="text-sm">
                                  <span className="font-medium">{booking.total_days} day{booking.total_days > 1 ? 's' : ''}</span> • ₹{booking.total_amount}
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground">STATUS</h4>
                              <div className="mt-1">
                                {booking.status === 'pending' && (
                                  <p className="text-sm text-yellow-600">⏳ Waiting for owner's response</p>
                                )}
                                {booking.status === 'confirmed' && (
                                  <p className="text-sm text-green-600">✅ Booking confirmed!</p>
                                )}
                                {booking.status === 'rejected' && (
                                  <p className="text-sm text-red-600">❌ Request rejected</p>
                                )}
                                {booking.status === 'cancelled' && (
                                  <p className="text-sm text-gray-600">🚫 Request cancelled</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {booking.notes && (
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground">YOUR NOTES</h4>
                              <p className="text-sm mt-1 italic">"{booking.notes}"</p>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            {booking.status === 'pending' ? 'Requested' : 
                             booking.status === 'confirmed' ? 'Confirmed' :
                             booking.status === 'rejected' ? 'Rejected' : 'Updated'} on {format(new Date(booking.updated_at), 'MMM dd, yyyy \'at\' HH:mm')}
                          </div>
                        </div>

                        {booking.status === 'pending' && (
                          <div className="flex gap-2 mt-4 pt-4 border-t">
                            <Button
                              onClick={() => handleCancelBooking(booking.id)}
                              variant="outline"
                              className="flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50"
                            >
                              Cancel Request
                            </Button>
                            <Button
                              onClick={() => router.push(`/items/${booking.item_id}`)}
                              variant="outline"
                            >
                              View Item
                            </Button>
                          </div>
                        )}

                        {booking.status === 'confirmed' && (
                          <div className="flex gap-2 mt-4 pt-4 border-t">
                            <Button
                              onClick={() => router.push(`/items/${booking.item_id}`)}
                              variant="outline"
                            >
                              View Item
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
