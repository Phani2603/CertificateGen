"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface Club {
  id: string
  name: string
  members: number
  color: string
  logoUrl?: string
  description?: string
  createdBy?: {
    _id?: string
    name?: string
    email?: string
  }
  createdAt?: string
}

interface ClubsSectionProps {
  userClubs: string[]
  availableClubs: Club[]
  clubEvents: Record<string, Array<{id: string, name: string, date: string}>>
  setSelectedClub: (club: string | null) => void
  setShowClubDetailModal: (show: boolean) => void
  setShowCreateClubModal: (show: boolean) => void
  joinClub?: (clubId: string) => Promise<any>
  leaveClub?: (clubId: string) => Promise<any>
}

export function ClubsSection({
  userClubs,
  availableClubs,
  clubEvents,
  setSelectedClub,
  setShowClubDetailModal,
  setShowCreateClubModal,
  joinClub,
  leaveClub,
}: ClubsSectionProps) {
  return (
    <>
      {/* Your Clubs */}
      <Card className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg md:text-xl lg:text-2xl">Your Clubs</h3>
          <span className="text-xs md:text-sm text-gray-500">{userClubs.length} clubs</span>
        </div>
        {userClubs.length === 0 ? (
          <div className="text-center py-6 md:py-8">
            <Image src="/14.svg" alt="Clubs" width={48} height={48}  />
            <p className="text-gray-500 mb-2 text-sm md:text-base">No club memberships yet</p>
            <p className="text-xs md:text-sm text-gray-400 mb-4">Browse available clubs or create your own</p>
            <Button 
              className="bg-[#21808D] hover:bg-[#1a6570] text-white text-sm md:text-base"
              onClick={() => setShowCreateClubModal(true)}
            >
              Create Your First Club
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {userClubs.map((club, i) => {
              const colors = [
                "from-[#FF5733] to-[#ff7a59]",
                "from-[#8FD6BD] to-[#a8e0cd]",
                "from-[#F4E04D] to-[#f7e878]"
              ]
              const clubData = availableClubs.find(c => c.name === club)
              return (
                <div 
                  key={club} 
                  className="flex items-center justify-between p-3 md:p-4 border-2 border-gray-100 rounded-lg hover:border-[#21808D] transition-all cursor-pointer group"
                  onClick={() => {
                    // Use club ID instead of club name
                    if (clubData?.id) {
                      setSelectedClub(clubData.id)
                      setShowClubDetailModal(true)
                    }
                  }}
                >
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    {clubData?.logoUrl ? (
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-white shadow-sm">
                        <img src={clubData.logoUrl} alt={club} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className={`w-12 h-12 md:w-12 md:h-12 flex items-center justify-center shrink-0`}>
                        <Image src="/14.svg" alt="Club" width={32} height={32}  />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm md:text-base truncate">{club}</h4>
                      {clubEvents[club] && clubEvents[club].length > 0 && (
                        <p className="text-xs text-gray-500">{clubEvents[club].length} events</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400 group-hover:text-[#21808D] shrink-0" />
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Available Clubs */}
      <Card className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg md:text-xl lg:text-2xl">Available Clubs</h3>
          <Button 
            size="sm"
            className="bg-[#21808D] hover:bg-[#1a6570] text-white text-xs md:text-sm"
            onClick={() => setShowCreateClubModal(true)}
          >
            Create Club
          </Button>
        </div>
        {availableClubs.filter(club => !userClubs.includes(club.name)).length === 0 ? (
          <div className="text-center py-6 md:py-8">
            <Image src="/11.svg" alt="No clubs available" width={64} height={64} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-2 text-sm md:text-base">No clubs available</p>
            <p className="text-xs md:text-sm text-gray-400">Be the first to create a club!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {availableClubs.filter(club => !userClubs.includes(club.name)).map((club) => (
              <div key={club.id || club.name} className="flex items-center justify-between p-3 md:p-4 border-2 border-gray-100 rounded-lg hover:border-[#21808D] transition-all group">
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  {club.logoUrl ? (
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-white shadow-sm">
                      <img src={club.logoUrl} alt={club.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${club.color} rounded-lg flex items-center justify-center shrink-0`}>
                      <Image src="/14.svg" alt="Club" width={32} height={32}  />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm md:text-base truncate">{club.name}</h4>
                    <p className="text-xs text-gray-500">{club.members} {club.members === 1 ? 'member' : 'members'}</p>
                  </div>
                </div>
                <Button 
                  size="sm"
                  className="bg-[#21808D] hover:bg-[#1a6570] text-white shrink-0 text-xs md:text-sm px-3 md:px-4"
                  onClick={async () => {
                    if (!userClubs.includes(club.name) && joinClub) {
                      try {
                        const result = await joinClub(club.id)
                        if (!result.success) {
                          toast.error(result.error || 'Failed to join club')
                        } else {
                          toast.success(`Successfully joined ${club.name}`)
                        }
                      } catch (error) {
                        console.error('Failed to join club:', error)
                        toast.error('Failed to join club. Please try again.')
                      }
                    }
                  }}
                >
                  Join
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
