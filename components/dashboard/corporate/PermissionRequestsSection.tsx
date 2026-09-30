"use client"

import { useState } from "react"
import { usePermissionRequests } from "@/hooks/useDashboardCache"

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
      <div className="bg-white border border-gray-200 rounded-lg p-5 py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-500 font-medium">Loading requests...</p>
          </div>
        </div>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5 py-12">
        <div className="flex flex-col items-center justify-center text-center">
          <CheckCircle className="w-12 h-12 text-gray-400 mb-4" strokeWidth={1.5} />
          <h3 className="text-xl font-medium text-gray-900 mb-1">You're all caught up</h3>
          <p className="text-gray-500">
            No pending permission requests from members at this time.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 flex-wrap text-gray-900">
          <Clock className="w-5 h-5 text-gray-700" />
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

      <div className="flex flex-col">
        {requests.map((request: PermissionRequest) => (
          <div key={request._id} className="py-4 border-b border-gray-100 last:border-0 group">
            <div className="flex items-start gap-4">
              {/* Left: Content */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="shrink-0 mt-0.5 text-gray-400 hover:text-gray-700 transition-colors"
                  title="View details"
                >
                  <Info className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${request.requestType === 'create_event'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                      }`}>
                      {request.requestType === 'create_event' ? 'CREATE' : 'DELETE'}
                    </span>
                    <h3 className="font-medium text-base text-gray-900 truncate">
                      {request.eventData?.eventName || 'Unnamed Event'}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[150px]">{request.requestedBy}</span>
                    </div>
                    {request.eventData?.eventDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
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

              {/* Right: Buttons (horizontal for a list layout) */}
              <div className="flex items-center gap-2 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-200 text-gray-600 hover:bg-gray-50 h-8 text-xs px-3"
                  onClick={() => handleDeny(request._id)}
                  disabled={processingId === request._id}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                  Deny
                </Button>
                <Button
                  size="sm"
                  className="bg-[#21808D] hover:bg-[#1a6370] text-white h-8 text-xs px-3"
                  onClick={() => handleApprove(request._id, request)}
                  disabled={processingId === request._id}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  Approve
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
                <span className={`text-xs font-semibold px-2 py-1 rounded ${selectedRequest.requestType === 'create_event'
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
    </div>
  )
}

