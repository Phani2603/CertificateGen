"use client"

import { useState } from "react"
import { usePermissionRequests } from "@/hooks/useDashboardCache"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, User, Calendar, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

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
    <div className="space-y-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 flex-wrap">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
          <span>Permission Requests</span>
          {requests.length > 0 && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {requests.length}
            </span>
          )}
        </h2>
        <p className="text-gray-600 text-xs sm:text-sm mt-1">
          Review and approve member requests
        </p>
      </div>

      <div className="space-y-3">
        {requests.map((request: PermissionRequest) => (
          <Card key={request._id} className="p-4 sm:p-5 border-2 border-orange-100 bg-orange-50/30">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full">
                {/* Icon */}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  request.requestType === 'create_event' 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  {request.requestType === 'create_event' ? (
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  ) : (
                    <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      request.requestType === 'create_event'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {request.requestType === 'create_event' ? 'CREATE EVENT' : 'DELETE EVENT'}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-base mb-1">
                    {request.eventData?.eventName || 'Unnamed Event'}
                  </h3>
                  
                  {request.eventData?.eventDescription && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {request.eventData.eventDescription}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{request.requestedBy}</span>
                    </div>
                    {request.eventData?.eventDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(request.eventData.eventDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(request.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-initial"
                  onClick={() => handleApprove(request._id, request)}
                  disabled={processingId === request._id}
                >
                  <CheckCircle className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Approve</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 flex-1 sm:flex-initial"
                  onClick={() => handleDeny(request._id)}
                  disabled={processingId === request._id}
                >
                  <XCircle className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Deny</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
