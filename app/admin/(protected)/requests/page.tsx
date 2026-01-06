"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Check, X, AlertCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSocket } from "@/components/socket-provider"
import { toast as sonnerToast } from "sonner"

interface AccessRequest {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
    image?: string
    userType: string
  }
  requestedType: string
  reason: string
  status: 'pending' | 'approved' | 'denied'
  createdAt: string
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { socket, isConnected, joinAdmin } = useSocket()

  useEffect(() => {
    fetchRequests()
  }, [])

  // Join admin room for real-time updates
  useEffect(() => {
    if (isConnected) {
      joinAdmin()
      console.log('👑 Joined admin room for real-time updates')
    }
  }, [isConnected, joinAdmin])

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return

    // New access request received
    socket.on('new-access-request', (data) => {
      console.log('📢 New access request:', data)
      sonnerToast.info('New Access Request', {
        description: `${data.userEmail} requested ${data.requestedType} access`,
      })
      fetchRequests() // Refresh list
    })

    // Access request status updated
    socket.on('access-request-updated', (data) => {
      console.log('📢 Access request updated:', data)
      fetchRequests() // Refresh list
    })

    return () => {
      socket.off('new-access-request')
      socket.off('access-request-updated')
    }
  }, [socket])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/access-requests')
      const data = await res.json()
      
      if (!res.ok && res.status === 401) {
        window.location.href = '/admin/login'
        return
      }
      
      if (data.success) {
        setRequests(data.requests)
      } else {
        console.error('Failed to fetch requests:', data.error)
      }
    } catch (error) {
      console.error("Failed to fetch requests", error)
      toast({
        title: "Error",
        description: "Failed to load access requests",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (requestId: string, status: 'approved' | 'denied') => {
    try {
      const res = await fetch('/api/admin/access-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: `Request ${status} successfully`,
        })
        fetchRequests() // Refresh list
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Failed to update request", error)
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Access Requests</h2>
          <p className="text-muted-foreground">Review requests for account type changes.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-gray-100 h-48" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium">All caught up!</h3>
            <p className="text-muted-foreground">There are no pending access requests at this time.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => (
            <Card key={req._id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={req.userId.image} />
                      <AvatarFallback>{req.userId.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{req.userId.name}</CardTitle>
                      <CardDescription>{req.userId.email}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {req.userId.userType || 'None'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Requesting:</span>
                    <Badge className="capitalize bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">
                      {req.requestedType}
                    </Badge>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600 mt-3">
                    <p className="font-medium text-xs text-gray-500 mb-1 uppercase">Reason</p>
                    "{req.reason}"
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <Clock className="w-3 h-3" />
                    Requested {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 p-3 flex gap-2">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700" 
                  size="sm"
                  onClick={() => handleAction(req._id, 'approved')}
                >
                  <Check className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1" 
                  size="sm"
                  onClick={() => handleAction(req._id, 'denied')}
                >
                  <X className="w-4 h-4 mr-2" /> Deny
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
