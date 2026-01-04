"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Users, Globe, Edit, ExternalLink } from "lucide-react"
import { useState } from "react"

interface CorporateOrgSectionProps {
  organization: {
    _id: string
    name: string
    slug: string
    description?: string
    logoUrl?: string
    website?: string
    allowedUsers: string[]
    isPublic: boolean
  }
  isOwner: boolean
}

export function CorporateOrgSection({ organization, isOwner }: CorporateOrgSectionProps) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="w-6 h-6 text-[#FF5733]" />
          Organization Overview
        </h2>
        {isOwner && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <Card className="p-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Logo Section */}
          <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
            {organization.logoUrl ? (
              <img 
                src={organization.logoUrl} 
                alt={organization.name}
                className="w-24 h-24 object-contain rounded-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-[#FF5733] to-[#21808D] rounded-lg flex items-center justify-center">
                <Building2 className="w-12 h-12 text-white" />
              </div>
            )}
            <p className="text-sm text-gray-600 mt-3 text-center">
              Organization Logo
            </p>
          </div>

          {/* Details Section */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <h3 className="text-2xl font-bold">{organization.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                Dashboard URL: /{organization.slug}-dashboard
              </p>
            </div>

            {organization.description && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                <p className="text-gray-600">{organization.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Members
                </p>
                <p className="text-2xl font-bold mt-1">{organization.allowedUsers.length}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Visibility
                </p>
                <p className="text-lg font-semibold mt-1">
                  {organization.isPublic ? (
                    <span className="text-green-600">Public</span>
                  ) : (
                    <span className="text-gray-600">Private</span>
                  )}
                </p>
              </div>
            </div>

            {organization.website && (
              <div className="pt-2">
                <a 
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#21808D] hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  {organization.website}
                </a>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
