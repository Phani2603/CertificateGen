"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Users, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Member {
  _id: string
  name: string
  email: string
  image?: string
}

interface MembersSectionProps {
  organizationId: string
  organizationSlug: string
}

export function MembersSection({ organizationId, organizationSlug }: MembersSectionProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [owner, setOwner] = useState<Member | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (organizationSlug) {
      fetchMembers()
    }
  }, [organizationSlug])

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/private-orgs/${organizationSlug}/members`)
      const data = await response.json()
      if (data.success) {
        setMembers(data.members || [])
        setOwner(data.owner)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-[#21808D]" />
          Team Members
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          People with access to this organization
        </p>
      </div>

      {isLoading ? (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-[#21808D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading members...</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="divide-y">
          {/* Owner */}
          {owner && (
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={owner.image} />
                  <AvatarFallback>{owner.name?.charAt(0) || 'O'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{owner.name}</p>
                  <p className="text-sm text-gray-500">{owner.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#21808D] bg-[#21808D]/10 px-3 py-1 rounded-full">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-medium">Owner</span>
              </div>
            </div>
          )}

          {/* Other Members */}
          {members.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No other members yet</p>
            </div>
          ) : (
            members.map((member) => (
              <div key={member._id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.image} />
                    <AvatarFallback>{member.name?.charAt(0) || 'M'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="text-gray-500 text-sm">Member</div>
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  )
}

