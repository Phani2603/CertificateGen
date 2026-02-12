"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Calendar, Award, Building2 } from "lucide-react"
import Image from "next/image"
import { useOrgStats } from "@/hooks/useDashboardCache"

interface EventSummary {
  eventName: string
  eventId: string
  certificateCount: number
  latestDate: string
}

interface CorporateActiveEventsSectionProps {
  organizationId: string
  organizationName: string
}

export function CorporateActiveEventsSection({ organizationId, organizationName }: CorporateActiveEventsSectionProps) {
  // Use SWR for caching history data
  const { history, isLoading } = useOrgStats(organizationId)
  const [activeEvents, setActiveEvents] = useState<EventSummary[]>([])

  useEffect(() => {
    if (history && history.length > 0) {
      // Group by event
      const eventMap = new Map<string, EventSummary>()
      
      history.forEach((item: any) => {
        const key = item.eventName
        
        if (!eventMap.has(key)) {
          eventMap.set(key, {
            eventName: item.eventName,
            eventId: item.id,
            certificateCount: item.certificateCount || 0,
            latestDate: item.date
          })
        } else {
          const existing = eventMap.get(key)!
          existing.certificateCount += item.certificateCount || 0
          // Keep the latest date
          if (new Date(item.date) > new Date(existing.latestDate)) {
            existing.latestDate = item.date
          }
        }
      })

      // Convert to array and sort by latest date
      const events = Array.from(eventMap.values()).sort((a, b) => 
        new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
      )

      setActiveEvents(events.slice(0, 6)) // Show top 6 events
    } else {
      setActiveEvents([])
    }
  }, [history])

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
          Recent events with certificate generation activity
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {activeEvents.map((event, index) => {
          const colorClass = colors[index % colors.length]
          
          return (
            <div 
              key={`${event.eventId}-${index}`}
              className="group relative"
            >
              {/* Capsule-style card */}
              <div className={`bg-gradient-to-br ${colorClass} rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer h-full`}>
                <div className="flex items-start gap-3">
                  {/* Icon Box */}
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
                    <Image src="/13.svg" alt="Event" width={24} height={24} className="opacity-90" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1">
                      {event.eventName}
                    </h3>
                    <p className="text-white/80 text-xs mb-2">
                      {new Date(event.latestDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-1.5">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
                        <Award className="w-3 h-3 text-white" />
                        <span className="text-xs font-medium text-white">
                          {event.certificateCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
