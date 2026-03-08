"use client"

import { useState } from "react"
import { usePermissionRequests } from "@/hooks/useDashboardCache"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, User, Calendar, Info } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PermissionRequest {
  _id: string
  requestedBy: string
  requestType: 'create_event' | 'delete_event'
  eventData?: {
    eventName?: string
    eventDescription?: string
    eventDate?: Date
    eventId?: string
  }
  status: 'pending' | 'approved' | 'denied'
  createdAt: string
}

interface PermissionRequestsSectionProps {
  organizationId: string
  isOwner: boolean
}

export function PermissionRequestsSection({ organizationId, isOwner }: PermissionRequestsSectionProps) {
  const { requests, isLoading, mutate: mutateRequests } = usePermissionRequests(isOwner ? organizationId : null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<PermissionRequest | null>(null)
  
  // Debug logging
  console.log('[PermissionRequestsSection]', {
    organizationId,
    isOwner,
    requestsCount: requests?.length || 0,
    isLoading,
    requests
  })

  const handleApprove = async (requestId: string, request: PermissionRequest) => {
    setProcessingId(requestId)
    try {
      // First, approve the request
      const approveResponse = await fetch('/api/permission-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          status: 'approved',
          privateOrgId: organizationId,
        }),
      })

      const approveData = await approveResponse.json()

      if (approveData.success) {
        // Execute the action based on request type
        if (request.requestType === 'create_event' && request.eventData) {
          const createResponse = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              privateOrgId: organizationId,
              name: request.eventData.eventName,
              description: request.eventData.eventDescription,
              date: request.eventData.eventDate,
            }),
          })

          const createData = await createResponse.json()
          if (createData.success || createData.event) {
            toast.success(`Event "${request.eventData.eventName}" created successfully!`)
          } else {
            toast.error('Failed to create event')
          }
        } else if (request.requestType === 'delete_event' && request.eventData?.eventId) {
          const deleteResponse = await fetch(`/api/events/${request.eventData.eventId}/delete`, {
            method: 'DELETE',
          })

          const deleteData = await deleteResponse.json()
          if (deleteData.success) {
            toast.success(`Event "${request.eventData.eventName}" deleted successfully!`)
          } else {
            toast.error('Failed to delete event')
          }
        }

        mutateRequests()
      } else {
        toast.error('Failed to approve request')
      }
    } catch (error) {
      console.error('Error approving request:', error)
      toast.error('Failed to approve request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeny = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      const response = await fetch('/api/permission-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          status: 'denied',
          privateOrgId: organizationId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Request denied')
        mutateRequests()
      } else {
        toast.error('Failed to deny request')
      }
    } catch (error) {
      console.error('Error denying request:', error)
      toast.error('Failed to deny request')
    } finally {
      setProcessingId(null)
    }
  }

  if (!isOwner) {
    return null
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#21808D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading requests...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card className="p-8 border-2 border-dashed border-gray-200">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">All caught up!</h3>
          <p className="text-sm text-gray-600">
            No pending permission requests from members
          </p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 flex-wrap">
            <Clock className="w-5 h-5 text-orange-500" />
            <span>Permission Requests</span>
            {requests.length > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {requests.length}
              </span>
            )}
          </h2>
          <p className="text-gray-600 text-xs mt-1">
            Review and approve member requests
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {requests.map((request: PermissionRequest) => (
            <div key={request._id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex items-start gap-3">
                {/* Left: Content */}
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="shrink-0 mt-0.5 hover:bg-gray-200 rounded p-0.5 transition-colors"
                    title="View details"
                  >
                    <Info className="w-4 h-4 text-gray-400" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        request.requestType === 'create_event'
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}>
                        {request.requestType === 'create_event' ? 'CREATE' : 'DELETE'}
                      </span>
                      <h3 className="font-semibold text-sm text-gray-900 truncate">
                        {request.eventData?.eventName || 'Unnamed Event'}
                      </h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{request.requestedBy}</span>
                      </div>
                      {request.eventData?.eventDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(request.eventData.eventDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Buttons (vertical) */}
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs px-3"
                    onClick={() => handleApprove(request._id, request)}
                    disabled={processingId === request._id}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-100 h-7 text-xs px-3"
                    onClick={() => handleDeny(request._id)}
                    disabled={processingId === request._id}
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Deny
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Full information about this permission request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Request Type</label>
                <div className="mt-1">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    selectedRequest.requestType === 'create_event'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}>
                    {selectedRequest.requestType === 'create_event' ? 'CREATE EVENT' : 'DELETE EVENT'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Event Name</label>
                <p className="text-sm text-gray-900 mt-1">{selectedRequest.eventData?.eventName || 'Unnamed Event'}</p>
              </div>

              {selectedRequest.eventData?.eventDescription && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Description</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedRequest.eventData.eventDescription}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-700">Requested By</label>
                <p className="text-sm text-gray-900 mt-1">{selectedRequest.requestedBy}</p>
              </div>

              {selectedRequest.eventData?.eventDate && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Event Date</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(selectedRequest.eventData.eventDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-700">Requested On</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(selectedRequest.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  onClick={() => {
                    handleApprove(selectedRequest._id, selectedRequest)
                    setSelectedRequest(null)
                  }}
                  disabled={processingId === selectedRequest._id}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 flex-1"
                  onClick={() => {
                    handleDeny(selectedRequest._id)
                    setSelectedRequest(null)
                  }}
                  disabled={processingId === selectedRequest._id}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Deny
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

