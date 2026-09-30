"use client"


import { Button } from "@/components/ui/button"
import { Building2, Users, Globe, Edit, ExternalLink } from "lucide-react"
import { TbBuildingBank } from "react-icons/tb"
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
  onEditClick?: () => void
}

export function CorporateOrgSection({ organization, isOwner, onEditClick }: CorporateOrgSectionProps) {

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-gray-800">Organization Overview</h3>
        {isOwner && onEditClick && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onEditClick}
            className="h-8 text-xs px-2.5"
          >
            <Edit className="w-3.5 h-3.5 mr-1.5" />
            Edit
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-5 items-start flex-1">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            {organization.logoUrl ? (
              <img 
                src={organization.logoUrl} 
                alt={organization.name}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg ring-1 ring-gray-200"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                <TbBuildingBank className="w-8 h-8 text-gray-500" />
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-gray-900 truncate">{organization.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                /{organization.slug}-dashboard
              </p>
            </div>

            {organization.description && (
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                {organization.description}
              </p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
              <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded text-xs">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-medium text-gray-700">{organization.allowedUsers.length}</span>
                <span className="text-gray-500 uppercase">Members</span>
              </div>

              <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded text-xs">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-medium">
                  {organization.isPublic ? (
                    <span className="text-green-600">Public</span>
                  ) : (
                    <span className="text-gray-600">Private</span>
                  )}
                </span>
              </div>
            </div>

            {organization.website && (
              <div className="pt-1">
                <a 
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-black hover:text-gray-700 font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{organization.website}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
  )
}

