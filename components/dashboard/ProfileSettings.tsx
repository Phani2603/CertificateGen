"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileSettingsProps {
  profileName: string
  setProfileName: (name: string) => void
  profileEmail: string
  setProfileEmail: (email: string) => void
  profilePhone: string
  setProfilePhone: (phone: string) => void
  profileBio: string
  setProfileBio: (bio: string) => void
  profileImageUrl: string
  setProfileImageUrl: (url: string) => void
  userOrganization: string | null
  isSavingProfile: boolean
  setIsSavingProfile: (saving: boolean) => void
  onSaveProfile: () => Promise<void>
}

export function ProfileSettings({
  profileName,
  setProfileName,
  profileEmail,
  setProfileEmail,
  profilePhone,
  setProfilePhone,
  profileBio,
  setProfileBio,
  profileImageUrl,
  setProfileImageUrl,
  userOrganization,
  isSavingProfile,
  setIsSavingProfile,
  onSaveProfile,
}: ProfileSettingsProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Information */}
      <Card className="bg-white p-6 md:p-8 rounded-2xl">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Profile Settings</h2>
        <form onSubmit={async (e) => {
          e.preventDefault()
          setIsSavingProfile(true)
          await onSaveProfile()
          setIsSavingProfile(false)
        }}>
          <div className="space-y-6">
            {/* Profile Image */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Profile Image URL</label>
              <Input 
                type="url"
                value={profileImageUrl}
                onChange={(e) => setProfileImageUrl(e.target.value)}
                placeholder="https://example.com/your-image.jpg" 
                className="max-w-md text-base" 
              />
              <p className="text-xs text-gray-500 mt-1">Provide a web URL for your profile picture</p>
              {profileImageUrl && (
                <div className="mt-3">
                  <p className="text-xs text-gray-600 mb-2">Preview:</p>
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={profileImageUrl} alt="Profile preview" />
                    <AvatarFallback className="bg-[#21808D] text-white text-xl">
                      {profileName ? profileName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Full Name *</label>
              <Input 
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="max-w-md text-base" 
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Email Address</label>
              <Input 
                value={profileEmail}
                className="max-w-md text-base" 
                disabled 
              />
              <p className="text-xs text-gray-500 mt-1">Email address cannot be changed</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Phone Number</label>
              <Input 
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="max-w-md text-base" 
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Bio</label>
              <textarea 
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full max-w-2xl p-3 border border-gray-300 rounded-lg text-base" 
                rows={4}
              />
            </div>

            {/* Organization */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Organization</label>
              <Input 
                value={userOrganization || "Not in any organization"}
                className="max-w-md text-base" 
                disabled 
              />
              <p className="text-xs text-gray-500 mt-1">Go to Organizations page to join or create one</p>
            </div>

            <Button 
              type="submit"
              disabled={isSavingProfile}
              className="bg-[#21808D] hover:bg-[#1a6570] text-white text-base px-6 py-2 disabled:opacity-50"
            >
              {isSavingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Account Actions */}
      <Card className="bg-white p-6 md:p-8 rounded-2xl">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Account Actions</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h3 className="font-semibold">Change Password</h3>
              <p className="text-sm text-gray-500">Update your password for better security</p>
            </div>
            <Button variant="outline" className="border-[#21808D] text-[#21808D] hover:bg-[#21808D] hover:text-white">
              Change
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <h3 className="font-semibold text-red-600">Delete Account</h3>
              <p className="text-sm text-red-500">Permanently delete your account and all data</p>
            </div>
            <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-600 hover:text-white">
              Delete
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
