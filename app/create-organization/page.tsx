"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Building2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function CreateOrganizationPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    isPublic: false,
  })

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f6]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#21808D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/private-orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create organization')
        return
      }

      // Redirect to the new organization dashboard
      router.push(`/${data.organization.slug}-dashboard`)
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f6f6] py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <Link href="/login" className="inline-flex items-center gap-2 mb-8 text-gray-600 hover:text-[#21808D] transition">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <Card className="bg-white p-8 md:p-12 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-16 h-16 bg-[#FF5733] rounded-xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Create Your Organization</h1>
              <p className="text-gray-600 mt-1">Set up your corporate dashboard</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., XYZ Corporation"
                className="h-12 mt-2"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be used to generate your unique dashboard URL
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell us about your organization..."
                className="mt-2 min-h-[100px]"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="website">Website (optional)</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://www.example.com"
                className="h-12 mt-2"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="w-4 h-4 text-[#21808D] border-gray-300 rounded focus:ring-[#21808D]"
              />
              <Label htmlFor="isPublic" className="cursor-pointer">
                Make organization publicly visible
              </Label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
              <p className="text-sm">
                <strong>Note:</strong> Once created, you'll get a custom dashboard URL like{" "}
                <code className="bg-blue-100 px-2 py-1 rounded">/{formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'your-org'}-abc123-dashboard</code>
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-[#21808D] hover:bg-[#1a6370] text-white font-semibold"
              disabled={isLoading || !formData.name}
            >
              {isLoading ? 'Creating...' : 'Create Organization'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
