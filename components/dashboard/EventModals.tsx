"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Users, FileText, X, ChevronRight, CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"

interface EventModalProps {
  showClubDetailModal: boolean
  setShowClubDetailModal: (show: boolean) => void
  showCreateEventModal: boolean
  setShowCreateEventModal: (show: boolean) => void
  selectedClub: string | null
  setSelectedClub: (club: string | null) => void
  clubEvents: Record<string, Array<{id: string, name: string, date: string}>>
  availableClubs: Array<{id: string, name: string, members: number, color: string, logoUrl?: string}>
  selectedEvent: {club: string, eventId: string, eventName: string} | null
  setSelectedEvent: (event: {club: string, eventId: string, eventName: string} | null) => void
  setCurrentPage: (page: "generate" | "history" | "settings" | "organizations") => void
  userClubs: string[]
  userOrganization: string | null
  eventDate: Date | undefined
  setEventDate: (date: Date | undefined) => void
  leaveClub?: (clubId: string) => Promise<any>
  createEvent?: (eventData: any) => Promise<any>
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
}: EventModalProps) {
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  
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
                {clubData.logoUrl ? (
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 overflow-hidden bg-white shadow-sm">
                    <img src={clubData.logoUrl} alt={clubData.name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-[#21808D] to-[#1a6570] rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                    <Users className="h-7 w-7 md:h-10 md:w-10 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-3xl font-bold truncate">{clubData.name}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs md:text-sm text-gray-500 truncate">
                      {userOrganization}
                    </p>
                    {clubData.members > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#21808D]/10 text-[#21808D] border border-[#21808D]/20">
                        <Users className="h-3 w-3 mr-1" />
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
                  onClick={async () => {
                    if (selectedClub && confirm(`Are you sure you want to leave this club?`)) {
                      if (leaveClub) {
                        const result = await leaveClub(selectedClub)
                        if (result.success) {
                          alert('Successfully left the club')
                          setShowClubDetailModal(false)
                          setSelectedClub(null)
                        } else {
                          alert(result.error || 'Failed to leave club')
                        }
                      }
                    }
                  }}
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
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-2">No events yet</p>
                  <p className="text-sm text-gray-400 mb-4">Create an event to start generating certificates</p>
                </div>
              ) : (
                clubEvents[clubData.id].map((event, i) => (
                  <div 
                    key={event.id} 
                    className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all cursor-pointer ${
                      selectedEvent?.eventId === event.id 
                        ? 'border-[#21808D] bg-[#21808D]/5' 
                        : 'border-gray-100 hover:border-[#21808D]'
                    }`}
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
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#8FD6BD] to-[#a8e0cd] rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-gray-900" />
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
                alert('Please enter an event name')
                return
              }
              
              if (!eventDate) {
                alert('Please select an event date')
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
                e.currentTarget.reset()
                setEventDate(undefined)
                setShowCreateEventModal(false)
                setShowClubDetailModal(false)
                
                alert(`Event "${eventName}" created successfully! You can now generate certificates.`)
              } else {
                alert(result.error || 'Failed to create event')
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
    </>
  )
}
