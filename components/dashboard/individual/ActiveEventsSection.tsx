"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Calendar, Award, Building2 } from "lucide-react"
import Image from "next/image"

interface EventSummary {
  eventName: string
  organizationName: string
  certificateCount: number
  latestDate: string
}

interface ActiveEventsSectionProps {
  userId?: string
}

export function ActiveEventsSection({ userId }: ActiveEventsSectionProps) {
  const [activeEvents, setActiveEvents] = useState<EventSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchActiveEvents()
  }, [userId])

  const fetchActiveEvents = async () => {
    try {
      const response = await fetch('/api/my-certificates')
      const data = await response.json()

      if (data.success) {
        // Group certificates by event
        const eventMap = new Map<string, EventSummary>()
        
        data.certificates.forEach((cert: any) => {
          const key = cert.eventName
          const orgName = cert.organizationName || cert.privateOrgName || "Organization"
          
          if (!eventMap.has(key)) {
            eventMap.set(key, {
              eventName: cert.eventName,
              organizationName: orgName,
              certificateCount: 1,
              latestDate: cert.issuedDate
            })
          } else {
            const existing = eventMap.get(key)!
            existing.certificateCount += 1
            // Keep the latest date
            if (new Date(cert.issuedDate) > new Date(existing.latestDate)) {
              existing.latestDate = cert.issuedDate
            }
          }
        })

        // Convert to array and sort by latest date
        const events = Array.from(eventMap.values()).sort((a, b) => 
          new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
        )

        setActiveEvents(events.slice(0, 6)) // Show top 6 events
      }
    } catch (error) {
      console.error('Error fetching active events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const colors = [
    "from-[#FF5733] to-[#ff7a59]",
    "from-[#8FD6BD] to-[#a8e0cd]",
    "from-[#F4E04D] to-[#f7e878]",
    "from-[#21808D] to-[#2a9faf]",
    "from-purple-500 to-purple-600",
    "from-pink-500 to-pink-600"
  ]

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#21808D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading events...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (activeEvents.length === 0) {
    return null // Don't show section if no events
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6 text-[#FF5733]" />
          Active Events
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Events where you've received certificates
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeEvents.map((event, index) => (
          <Card 
            key={`${event.eventName}-${index}`}
            className="p-5 hover:shadow-md transition-all bg-white border-2 border-gray-100"
          >
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${colors[index % colors.length]} rounded-lg flex items-center justify-center shrink-0`}>
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base line-clamp-2 mb-1">
                  {event.eventName}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate">{event.organizationName}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Award className="w-3 h-3" />
                    <span>{event.certificateCount} certificate{event.certificateCount > 1 ? 's' : ''}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(event.latestDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
