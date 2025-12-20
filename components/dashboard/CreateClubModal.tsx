"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, X } from "lucide-react"

interface CreateClubModalProps {
  showCreateClubModal: boolean
  setShowCreateClubModal: (show: boolean) => void
  hasOrganization: boolean
  userClubs: string[]
  availableClubs: Array<{id: string, name: string, members: number, color: string, logoUrl?: string}>
  createClub?: (clubData: any) => Promise<any>
}

export function CreateClubModal({
  showCreateClubModal,
  setShowCreateClubModal,
  hasOrganization,
  userClubs,
  availableClubs,
  createClub,
}: CreateClubModalProps) {
  if (!showCreateClubModal || !hasOrganization) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <Card className="bg-white p-6 md:p-8 rounded-2xl max-w-2xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">Create New Club</h2>
          <Button variant="ghost" size="sm" onClick={() => setShowCreateClubModal(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <form onSubmit={async (e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          const clubName = formData.get('clubName') as string
          const clubDescription = formData.get('clubDescription') as string
          const clubLogoUrl = formData.get('clubLogoUrl') as string
          
          if (createClub) {
            try {
              const result = await createClub({
                name: clubName,
                description: clubDescription,
                logoUrl: clubLogoUrl || undefined,
              })
              
              if (result.success) {
                setShowCreateClubModal(false)
                alert('Club created successfully!')
              } else {
                alert(result.error || 'Failed to create club')
              }
            } catch (error) {
              console.error('Failed to create club:', error)
              alert('Failed to create club. Please try again.')
            }
          } else {
            alert('Create club functionality not available')
          }
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Club Logo URL (Optional)</label>
              <Input 
                type="url"
                name="clubLogoUrl"
                placeholder="https://example.com/logo.png" 
                className="text-sm md:text-base" 
              />
              <p className="text-xs text-gray-500 mt-1">Provide a web URL for your club's logo</p>
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Club Name *</label>
              <Input 
                name="clubName"
                placeholder="e.g., Coding Club, Photography Club" 
                className="text-sm md:text-base" 
                required
              />
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Description</label>
              <textarea 
                name="clubDescription"
                className="w-full p-3 border border-gray-300 rounded-lg text-sm md:text-base" 
                rows={4} 
                placeholder="Tell us about your club..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                type="button"
                variant="outline" 
                className="flex-1"
                onClick={() => setShowCreateClubModal(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-[#21808D] hover:bg-[#1a6570] text-white"
              >
                Create Club
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}
