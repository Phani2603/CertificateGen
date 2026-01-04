"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar as CalendarIcon, Plus, Award, Trash2, X, ChevronRight, ChevronLeft, Info } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { toast } from "sonner"
import TemplateUpload from "@/components/steps/template-upload"
import FieldConfiguration from "@/components/steps/field-configuration"
import CertificateGeneration from "@/components/steps/certificate-generation"
import type { CertificateField } from "@/types/certificate"
import Image from "next/image"

type Step = "upload" | "configure" | "generate"

interface AppState {
  templateImage: string | null
  templateS3Key?: string
  fields: CertificateField[]
  csvData: Array<Record<string, string>>
}

interface Event {
  _id: string
  name: string
  date: string
  description?: string
  certificatesGenerated: number
  recipientCount: number
}

interface CorporateEventsSectionProps {
  organizationId: string
  organizationSlug: string
  organizationName: string
  isOwner: boolean
}

export function CorporateEventsSection({ 
  organizationId, 
  organizationSlug,
  organizationName,
  isOwner 
}: CorporateEventsSectionProps) {
  console.log('[CorporateEventsSection] Props:', { organizationId, organizationSlug, organizationName, isOwner })
  
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined)
  const [isCreating, setIsCreating] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [infoEvent, setInfoEvent] = useState<Event | null>(null)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'generate'>('list')
  const [currentStep, setCurrentStep] = useState<Step>("upload")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const [appState, setAppState] = useState<AppState>({
    templateImage: null,
    fields: [],
    csvData: [],
  })

  useEffect(() => {
    fetchEvents()
  }, [organizationId])

  // Calculate pagination
  const totalPages = Math.ceil(events.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentEvents = events.slice(startIndex, endIndex)

  // Reset to page 1 if current page exceeds total pages
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1)
  }

  const colors = [
    "from-[#FF5733] to-[#ff7a59]",
    "from-[#8FD6BD] to-[#a8e0cd]",
    "from-[#F4E04D] to-[#f7e878]",
    "from-[#21808D] to-[#2a9faf]",
    "from-purple-500 to-purple-600",
    "from-pink-500 to-pink-600"
  ]

  useEffect(() => {
    fetchEvents()
  }, [organizationId])

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/events?privateOrgId=${organizationId}`)
      const data = await response.json()

      if (data.success) {
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsCreating(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    console.log('[Events] Creating event:', { name, description, eventDate, organizationId })

    if (!eventDate) {
      toast.error('Please select an event date')
      setIsCreating(false)
      return
    }

    try {
      if (!isOwner) {
        // Non-owner: Request permission
        const response = await fetch('/api/permission-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            privateOrgId: organizationId,
            requestType: 'create_event',
            eventData: {
              eventName: name,
              eventDescription: description,
              eventDate: eventDate.toISOString(),
            },
          }),
        })

        const data = await response.json()
        console.log('[Events] Permission request response:', data)

        if (data.success) {
          toast.success(data.message || 'Permission request submitted! Waiting for owner approval.')
          setShowCreateModal(false)
          setEventDate(undefined)
          e.currentTarget.reset()
        } else {
          toast.error(data.error || 'Failed to request permission')
        }
      } else {
        // Owner: Create directly
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            privateOrgId: organizationId,
            name,
            description,
            date: eventDate.toISOString(),
          }),
        })

        const data = await response.json()
        console.log('[Events] Response:', data)

        if (data.success || data.event) {
          toast.success('Event created successfully!')
          setShowCreateModal(false)
          setEventDate(undefined)
          fetchEvents()
          e.currentTarget.reset()
        } else {
          toast.error(data.error || 'Failed to create event')
        }
      }
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('Failed to create event')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!confirm(`Are you sure you want to delete "${eventName}"?`)) return

    setIsRequestingPermission(true)
    try {
      if (!isOwner) {
        // Non-owner: Request permission
        const response = await fetch('/api/permission-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            privateOrgId: organizationId,
            requestType: 'delete_event',
            eventData: {
              eventId: eventId,
              eventName: eventName,
            },
          }),
        })

        const data = await response.json()

        if (data.success) {
          toast.success(data.message || 'Delete request submitted! Waiting for owner approval.')
        } else {
          toast.error(data.error || 'Failed to request permission')
        }
      } else {
        // Owner: Delete directly
        const response = await fetch(`/api/events/${eventId}/delete`, {
          method: 'DELETE',
        })

        const data = await response.json()

        if (data.success) {
          toast.success('Event deleted successfully')
          fetchEvents()
        } else {
          toast.error(data.error || 'Failed to delete event')
        }
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Failed to delete event')
    } finally {
      setIsRequestingPermission(false)
    }
  }

  const handleOpenGenerate = (event: Event) => {
    setSelectedEvent(event)
    setViewMode('generate')
    setCurrentStep("upload")
  }

  const handleTemplateUpload = (data: { image: string; s3Key?: string }) => {
    setAppState((prev) => ({
      ...prev,
      templateImage: data.image,
      templateS3Key: data.s3Key || undefined,
    }))
    setCurrentStep("configure")
  }

  const handleFieldsUpdate = (fields: CertificateField[]) => {
    setAppState((prev) => ({ ...prev, fields }))
  }

  const handleCsvUpload = (data: Array<Record<string, string>>) => {
    setAppState((prev) => ({ ...prev, csvData: data }))
  }

  const handleBack = () => {
    if (currentStep === "configure") setCurrentStep("upload")
    if (currentStep === "generate") setCurrentStep("configure")
    if (currentStep === "upload") setViewMode("list")
  }

  const addToHistory = async (eventName: string, clubName: string, count: number, totalSizeBytes: number) => {
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent?._id,
          eventName,
          clubId: null, 
          clubName: organizationName,
          certificateCount: count,
          totalSize: totalSizeBytes,
          batchId: crypto.randomUUID(),
          certificateIds: [],
          privateOrgId: organizationId,
        }),
      })

      toast.success(`Generated ${count} certificates for ${eventName}`)
      // Don't automatically navigate away - let users see results and download
      fetchEvents()
    } catch (error) {
      console.error('Error adding to history:', error)
      toast.error('Failed to save history')
    }
  }


  return (
    <>
      <div className="space-y-4">
        {viewMode === 'list' ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6 text-[#21808D]" />
                  Company Events
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage events and generate certificates for attendees
                </p>
              </div>
              <Button 
                className="bg-[#21808D] hover:bg-[#1a6370]"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>

            {isLoading ? (
              <Card className="p-8">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 border-4 border-[#21808D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading events...</p>
                  </div>
                </div>
              </Card>
            ) : events.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <Image src="/13.svg" alt="Events" width={64} height={64} className="mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first company event to start generating certificates
                  </p>
                  <Button 
                    className="bg-[#21808D] hover:bg-[#1a6370]"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Event
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {currentEvents.map((event, index) => (
                    <Card key={event._id} className="p-3 hover:shadow-md transition-all bg-white border-2 border-gray-100">
                      <div className="space-y-2">
                        {/* Event Icon */}
                        <div className="flex items-start justify-between">
                          <div className={`w-10 h-10 bg-gradient-to-br ${colors[(startIndex + index) % colors.length]} rounded-lg flex items-center justify-center shrink-0`}>
                            <Image src="/13.svg" alt="Event" width={20} height={20} />
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 -mt-1 h-7 w-7 p-0"
                              onClick={() => {
                                setInfoEvent(event)
                                setShowInfoModal(true)
                              }}
                            >
                              <Info className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 -mt-1 h-7 w-7 p-0"
                              onClick={() => handleDeleteEvent(event._id, event.name)}
                              disabled={isRequestingPermission}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Event Details */}
                        <div>
                          <h3 className="font-semibold text-sm line-clamp-2 mb-0.5">{event.name}</h3>
                          <p className="text-xs text-gray-600">
                            {new Date(event.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          {event.certificatesGenerated > 0 && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                              <Award className="w-3 h-3" />
                              <span>{event.certificatesGenerated} generated</span>
                            </div>
                          )}
                        </div>

                        {/* Generate Button */}
                        <Button
                          size="sm"
                          className="w-full bg-[#21808D] hover:bg-[#1a6370] text-white text-xs h-8"
                          onClick={() => handleOpenGenerate(event)}
                        >
                          <Award className="w-3 h-3 mr-1" />
                          Generate
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1}-{Math.min(endIndex, events.length)} of {events.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                          // Show first, last, current, and adjacent pages
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={`h-8 w-8 p-0 ${
                                  currentPage === page 
                                    ? "bg-[#21808D] hover:bg-[#1a6570] text-white" 
                                    : ""
                                }`}
                              >
                                {page}
                              </Button>
                            )
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <span key={page} className="px-1 text-gray-400">
                                ...
                              </span>
                            )
                          }
                          return null
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Generate Certificates</h2>
                <p className="text-gray-600 mt-1">{selectedEvent?.name}</p>
              </div>
              <Button variant="outline" onClick={() => setViewMode('list')}>
                Back to Events
              </Button>
            </div>

            {/* Progress Indicator */}
            <div className="flex gap-4 mb-8">
              {(["upload", "configure", "generate"] as const).map((step, index) => (
                <div key={step} className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep === step
                        ? "bg-[#21808D] text-white"
                        : index < (currentStep === "upload" ? 0 : currentStep === "configure" ? 1 : 2)
                          ? "bg-[#21808D] text-white"
                          : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-700 hidden sm:inline">
                    {step === "upload" && "Upload Template"}
                    {step === "configure" && "Configure Fields"}
                    {step === "generate" && "Generate"}
                  </span>
                  {index < 2 && <div className="w-8 h-0.5 bg-gray-300 hidden sm:block" />}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-lg">
              {currentStep === "upload" && selectedEvent && (
                <TemplateUpload 
                  onUpload={handleTemplateUpload}
                  selectedEvent={{
                    club: organizationSlug,
                    eventId: selectedEvent._id,
                    eventName: selectedEvent.name
                  }}
                  organization={{
                    id: organizationId,
                    name: organizationName
                  }}
                />
              )}
              {currentStep === "configure" && appState.templateImage && (
                <FieldConfiguration
                  templateImage={appState.templateImage}
                  fields={appState.fields}
                  onFieldsUpdate={handleFieldsUpdate}
                  onNext={() => setCurrentStep("generate")}
                  onBack={handleBack}
                />
              )}
              {currentStep === "generate" && selectedEvent && (
                <CertificateGeneration
                  templateImage={appState.templateImage!}
                  templateS3Key={appState.templateS3Key}
                  fields={appState.fields}
                  onCsvUpload={handleCsvUpload}
                  onBack={handleBack}
                  selectedEvent={{
                    club: organizationSlug,
                    eventId: selectedEvent._id,
                    eventName: selectedEvent.name
                  }}
                  onAddToHistory={addToHistory}
                  organization={{
                    id: organizationId,
                    name: organizationName
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white p-8 rounded-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Create Event</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleCreateEvent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Event Name *</label>
                  <Input 
                    name="name"
                    placeholder="e.g., Annual Tech Conference 2026" 
                    className="text-base" 
                    required
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <Textarea 
                    name="description"
                    placeholder="Brief description of the event..." 
                    className="text-base resize-none" 
                    rows={3}
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Event Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !eventDate && "text-muted-foreground"
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eventDate ? format(eventDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-60" align="start">
                      <Calendar
                        mode="single"
                        selected={eventDate}
                        onSelect={setEventDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 bg-[#21808D] hover:bg-[#1a6570] text-white"
                    disabled={isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Create Event'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Event Info Modal */}
      {showInfoModal && infoEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white p-8 rounded-2xl max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Event Details</h2>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowInfoModal(false)
                setInfoEvent(null)
              }}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Event Name</label>
                <p className="text-lg font-semibold mt-1">{infoEvent.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Event Date</label>
                <p className="text-base mt-1">
                  {new Date(infoEvent.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              {infoEvent.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-base mt-1 text-gray-700">{infoEvent.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-gray-600">Certificates Generated</label>
                  <p className="text-2xl font-bold text-[#21808D] mt-1">{infoEvent.certificatesGenerated || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Recipients</label>
                  <p className="text-2xl font-bold text-[#21808D] mt-1">{infoEvent.recipientCount || 0}</p>
                </div>
              </div>
            </div>
            <Button 
              className="w-full mt-6 bg-[#21808D] hover:bg-[#1a6370]"
              onClick={() => {
                setShowInfoModal(false)
                setInfoEvent(null)
              }}
            >
              Close
            </Button>
          </Card>
        </div>
      )}
    </>
  )
}
