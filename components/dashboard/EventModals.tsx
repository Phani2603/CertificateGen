"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { X, ChevronRight, CalendarIcon, Loader2, Info, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Image from "next/image"

interface EventModalProps {
  showClubDetailModal: boolean
  setShowClubDetailModal: (show: boolean) => void
  showCreateEventModal: boolean
  setShowCreateEventModal: (show: boolean) => void
  selectedClub: string | null
  setSelectedClub: (club: string | null) => void
  clubEvents: Record<string, Array<{id: string, name: string, date: string}>>
  availableClubs: Array<{
    id: string, 
    name: string, 
    members: number, 
    color: string, 
    logoUrl?: string,
    description?: string,
    createdBy?: {
      _id?: string,
      name?: string,
      email?: string
    },
    createdAt?: string
  }>
  selectedEvent: {club: string, eventId: string, eventName: string} | null
  setSelectedEvent: (event: {club: string, eventId: string, eventName: string} | null) => void
  setCurrentPage: (page: "generate" | "history" | "settings" | "organizations") => void
  userClubs: string[]
  userOrganization: string | null
  eventDate: Date | undefined
  setEventDate: (date: Date | undefined) => void
  leaveClub?: (clubId: string) => Promise<any>
  createEvent?: (eventData: any) => Promise<any>
  deleteEvent?: (eventId: string) => Promise<any>
  refreshClubEvents?: (clubId: string) => Promise<void>
}

export function EventModals({
  showClubDetailModal,
  setShowClubDetailModal,
  showCreateEventModal,
  setShowCreateEventModal,
  selectedClub,
  setSelectedClub,
  clubEvents,
  availableClubs,
  selectedEvent,
  setSelectedEvent,
  setCurrentPage,
  userClubs,
  userOrganization,
  eventDate,
  setEventDate,
  leaveClub,
  createEvent,
  deleteEvent,
  refreshClubEvents,
}: EventModalProps) {
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [showInfoPopover, setShowInfoPopover] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<{id: string, name: string} | null>(null)
  
  const handleLeaveClub = async () => {
    if (selectedClub && leaveClub) {
      const result = await leaveClub(selectedClub)
      if (result.success) {
        toast.success('Successfully left the club')
        setShowClubDetailModal(false)
        setSelectedClub(null)
      } else {
        toast.error(result.error || 'Failed to leave club')
      }
    }
    setShowLeaveConfirm(false)
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete || !deleteEvent) return

    try {
      const result = await deleteEvent(eventToDelete.id)
      if (result.success) {
        toast.success(`Event "${eventToDelete.name}" deleted successfully`)
        
        // Clear selected event if it was the deleted one
        if (selectedEvent?.eventId === eventToDelete.id) {
          setSelectedEvent(null)
        }
        
        // Refresh club events
        if (selectedClub && refreshClubEvents) {
          await refreshClubEvents(selectedClub)
        }
      } else {
        toast.error(result.error || 'Failed to delete event')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Failed to delete event')
    } finally {
      setShowDeleteConfirm(false)
      setEventToDelete(null)
    }
  }
  
  return (
    <>
      {/* Club Detail Modal - Shows Events */}
      {showClubDetailModal && selectedClub && (() => {
        const clubData = availableClubs.find(c => c.id === selectedClub)
        return clubData ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <Card className="bg-white p-4 md:p-8 rounded-2xl max-w-3xl w-full max-h-[85vh] md:max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                <div className="relative">
                  {clubData.logoUrl ? (
                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 overflow-hidden bg-white shadow-sm">
                      <img src={clubData.logoUrl} alt={clubData.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 md:w-20 md:h-20 md:rounded-2xl flex items-center justify-center shrink-0">
                      <Image src="/14.svg" alt="Club" width={40} height={40} className="md:w-[56px] md:h-[56px]" />
                    </div>
                  )}
                  {/* Info Icon Popover */}
                  <Popover open={showInfoPopover} onOpenChange={setShowInfoPopover}>
                    <PopoverTrigger asChild>
                      <button 
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#21808D] hover:bg-[#1a6570] rounded-full flex items-center justify-center shadow-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowInfoPopover(!showInfoPopover)
                        }}
                      >
                        <Info className="h-3.5 w-3.5 text-white" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" side="right" align="start">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-[#21808D]">Club Information</h4>
                        
                        {clubData.description && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                            <p className="text-sm text-gray-700">{clubData.description}</p>
                          </div>
                        )}
                        
                        {clubData.createdBy && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Created By</p>
                            <p className="text-sm text-gray-700">{clubData.createdBy.name || 'Unknown'}</p>
                          </div>
                        )}
                        
                        {clubData.createdAt && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Created On</p>
                            <p className="text-sm text-gray-700">
                              {new Date(clubData.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Total Members</p>
                          <p className="text-sm text-gray-700">{clubData.members}</p>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-3xl font-bold truncate">{clubData.name}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs md:text-sm text-gray-500 truncate">
                      {userOrganization}
                    </p>
                    {clubData.members > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#21808D]/10 text-[#21808D] border border-[#21808D]/20">
                        <Image src="/13.svg" alt="" width={12} height={12} className="mr-1" />
                        {clubData.members} {clubData.members === 1 ? 'member' : 'members'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setShowLeaveConfirm(true)}
                >
                  Leave Club
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  setShowClubDetailModal(false)
                  setSelectedClub(null)
                }}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Events</h3>
              <Button 
                className="bg-[#21808D] hover:bg-[#1a6570] text-white"
                onClick={() => setShowCreateEventModal(true)}
              >
                Create Event
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {(!clubEvents[clubData.id] || clubEvents[clubData.id].length === 0) ? (
                <div className="text-center py-12">
                  <Image src="/13.svg" alt="Events" width={64} height={64} />
                  <p className="text-gray-500 mb-2">No events yet</p>
                  <p className="text-sm text-gray-400 mb-4">Create an event to start generating certificates</p>
                </div>
              ) : (
                clubEvents[clubData.id].map((event, i) => (
                  <div 
                    key={event.id} 
                    className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                      selectedEvent?.eventId === event.id 
                        ? 'border-[#21808D] bg-[#21808D]/5' 
                        : 'border-gray-100 hover:border-[#21808D]'
                    }`}
                  >
                    <div 
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedEvent({
                          club: clubData.id,
                          eventId: event.id,
                          eventName: event.name
                        })
                        setShowClubDetailModal(false)
                        setCurrentPage("generate")
                      }}
                    >
                      <div className="w-12 h-12 flex items-center justify-center">
                        <Image src="/13.svg" alt="Event" width={32} height={32} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{event.name}</h4>
                        <p className="text-sm text-gray-500">{event.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedEvent?.eventId === event.id && (
                        <span className="text-xs px-2 py-1 bg-[#21808D] text-white rounded-full">Active</span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEventToDelete({ id: event.id, name: event.name })
                          setShowDeleteConfirm(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
        ) : null
      })()}

      {/* Create Event Modal */}
      {showCreateEventModal && selectedClub && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <Card className="bg-white p-8 rounded-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Create Event</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateEventModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              
              if (!selectedClub || !createEvent) return
              
              const formData = new FormData(e.currentTarget)
              const eventName = formData.get('eventName') as string
              const description = formData.get('description') as string
              
              if (!eventName.trim()) {
                toast.error('Please enter an event name')
                return
              }
              
              if (!eventDate) {
                toast.error('Please select an event date')
                return
              }
              
              setIsCreatingEvent(true)
              
              const result = await createEvent({
                clubId: selectedClub,
                name: eventName.trim(),
                description: description?.trim() || '',
                date: eventDate.toISOString(),
              })
              
              setIsCreatingEvent(false)
              
              if (result.success) {
                // Get the newly created event details
                const newEvent = result.event
                const clubData = availableClubs.find(c => c.id === selectedClub)
                
                // Select the newly created event
                if (newEvent && clubData) {
                  setSelectedEvent({
                    club: selectedClub,
                    eventId: newEvent._id || newEvent.id,
                    eventName: eventName.trim()
                  })
                  
                  // Navigate to generate page
                  setCurrentPage('generate')
                }
                
                // Reset form and state before closing modal
                e.currentTarget?.reset()
                setEventDate(undefined)
                setShowCreateEventModal(false)
                setShowClubDetailModal(false)
                
                toast.success(`Event "${eventName}" created successfully! You can now generate certificates.`)
              } else {
                toast.error(result.error || 'Failed to create event')
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Event Name *</label>
                  <Input 
                    name="eventName"
                    placeholder="e.g., Annual Tech Fest 2025, Workshop on AI" 
                    className="text-base" 
                    required
                    disabled={isCreatingEvent}
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <Textarea 
                    name="description"
                    placeholder="Brief description of the event..." 
                    className="text-base resize-none" 
                    rows={3}
                    disabled={isCreatingEvent}
                  />
                </div>
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Event Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal text-sm md:text-base ${
                          !eventDate && "text-muted-foreground"
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eventDate ? format(eventDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[70]" align="start">
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
                    onClick={() => setShowCreateEventModal(false)}
                    disabled={isCreatingEvent}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 bg-[#21808D] hover:bg-[#1a6570] text-white"
                    disabled={isCreatingEvent}
                  >
                    {isCreatingEvent ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create & Select Event'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}
      
      {/* Leave Club Confirmation Dialog */}
      <ConfirmationDialog
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        title="Leave Club"
        description="Are you sure you want to leave this club? You can always rejoin later."
        confirmText="Leave Club"
        cancelText="Cancel"
        onConfirm={handleLeaveClub}
        variant="destructive"
      />

      {/* Delete Event Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Event"
        description={`Are you sure you want to delete "${eventToDelete?.name}"? This will permanently delete all certificates, history entries, and related data. This action cannot be undone.`}
        confirmText="Delete Event"
        cancelText="Cancel"
        onConfirm={handleDeleteEvent}
        variant="destructive"
      />
    </>
  )
}
