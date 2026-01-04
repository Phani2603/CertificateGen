"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface CorporateSettingsProps {
  organization: any
  onUpdate: (data: any) => Promise<void>
}

export function CorporateSettings({ organization, onUpdate }: CorporateSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: organization.name,
    description: organization.description || "",
    website: organization.website || "",
    logoUrl: organization.logoUrl || "",
    isPublic: organization.isPublic || false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onUpdate(formData)
      toast.success("Organization settings updated successfully")
    } catch (error) {
      toast.error("Failed to update settings")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border-gray-100">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Organization Settings</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">Logo URL</label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <Input 
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png" 
                  className="text-base" 
                />
                <p className="text-xs text-gray-500 mt-1">Provide a direct link to your organization's logo</p>
              </div>
              {formData.logoUrl && (
                <Avatar className="w-16 h-16 border border-gray-200">
                  <AvatarImage src={formData.logoUrl} alt="Logo preview" />
                  <AvatarFallback className="bg-[#21808D] text-white text-xl">
                    {formData.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">Organization Name *</label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="text-base" 
              required
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">Website URL</label>
            <Input 
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
              className="text-base" 
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">Description</label>
            <Textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us about your organization..."
              className="text-base min-h-[100px]" 
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="space-y-0.5">
              <Label className="text-base font-medium text-gray-900">Public Profile</Label>
              <p className="text-sm text-gray-500">
                Allow anyone to view your organization's public page
              </p>
            </div>
            <Switch 
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full md:w-auto bg-[#21808D] hover:bg-[#1a6b76] text-white min-w-[150px]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
