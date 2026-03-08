"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Phone, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function ProfileSection() {
  const { data: session, update } = useSession()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    organization: "",
    image: "",
  })

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile")
        const data = await response.json()

        if (data.success) {
          setFormData({
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            bio: data.user.bio || "",
            organization: data.user.organization || "",
            image: data.user.image || session?.user?.image || "",
          })
        }
      } catch (error) {
        console.error("Failed to load profile:", error)
        toast.error("Failed to load profile")
      }
    }

    if (session) loadProfile()
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          bio: formData.bio,
          organization: formData.organization,
          image: formData.image,
        }),
      })

      const data = await response.json()

      if (data.success) {
        await update({
          name: data.user.name,
          image: data.user.image,
        })
        toast.success("Profile updated successfully")
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Account deleted successfully")
        // Sign out the user and redirect to home page
        await signOut({ redirect: true, callbackUrl: "/" })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Failed to delete account:", error)
      toast.error("Failed to delete account")
      setIsDeleting(false)
    }
  }

  const initials = formData.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "??"

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src={formData.image} alt={formData.name} />
          <AvatarFallback className="text-lg bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-semibold">{formData.name}</h2>
          <p className="text-sm text-muted-foreground">{formData.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Profile Image URL */}
          <div>
            <Label htmlFor="image" className="text-sm">Profile Image URL</Label>
            <Input
              id="image"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="mt-1.5"
            />
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-sm flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="mt-1.5"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <Label htmlFor="email" className="text-sm flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="mt-1.5 bg-muted"
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone" className="text-sm flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1.5"
            />
          </div>

          {/* Organization */}
          <div className="md:col-span-2">
            <Label htmlFor="organization" className="text-sm">Organization</Label>
            <Input
              id="organization"
              type="text"
              placeholder="Your company or institution"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              className="mt-1.5"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <Label htmlFor="bio" className="text-sm">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell us about yourself..."
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formData.bio.length}/500 characters
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            className="w-auto px-6"
            disabled={isSaving}
          >
            {isSaving ? (
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

      {/* Danger Zone */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="text-sm font-semibold text-destructive mb-2">Danger Zone</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Once you delete your account, there is no going back.
        </p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className="text-white"
        >
          {isDeleting ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete Account
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
