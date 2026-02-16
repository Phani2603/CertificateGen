"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, User, X } from "lucide-react"
import { TbBuildingBank } from "react-icons/tb"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface UserTypeSelectionModalProps {
  isOpen: boolean
  onClose?: () => void
}

export function UserTypeSelectionModal({ isOpen, onClose }: UserTypeSelectionModalProps) {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<"corporate" | "individual" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!selectedType) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType: selectedType }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update user type')
      }

      // Redirect based on type
      if (selectedType === "individual") {
        router.push("/individual-dashboard")
      } else {
        router.push("/create-organization")
      }
      
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            How do you want to use GetCertificates?
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            We'll personalize your setup experience accordingly.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Corporate/Business Card */}
          <button
            onClick={() => setSelectedType("corporate")}
            className={cn(
              "flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all",
              selectedType === "corporate"
                ? "border-[#21808D] bg-[#21808D]/5"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center transition-colors",
              selectedType === "corporate" ? "bg-[#FF5733]" : "bg-gray-100"
            )}>
              <TbBuildingBank className={cn(
                "w-8 h-8",
                selectedType === "corporate" ? "text-white" : "text-gray-600"
              )} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">Corporate/Business</h3>
              <p className="text-sm text-gray-600 mb-3">
                Generate certificates for your company events, training programs, and employee recognition
              </p>
              <ul className="text-xs text-gray-500 space-y-1 text-left">
                <li>✓ Custom organization dashboard</li>
                <li>✓ Invite team members</li>
                <li>✓ Manage company events</li>
                <li>✓ Bulk certificate generation</li>
              </ul>
            </div>
          </button>

          {/* Individual Card */}
          <button
            onClick={() => setSelectedType("individual")}
            className={cn(
              "flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all",
              selectedType === "individual"
                ? "border-[#21808D] bg-[#21808D]/5"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center transition-colors",
              selectedType === "individual" ? "bg-[#8FD6BD]" : "bg-gray-100"
            )}>
              <User className={cn(
                "w-8 h-8",
                selectedType === "individual" ? "text-black" : "text-gray-600"
              )} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">Individual</h3>
              <p className="text-sm text-gray-600 mb-3">
                Verify and manage certificates you've received from organizations and events
              </p>
              <ul className="text-xs text-gray-500 space-y-1 text-left">
                <li>✓ View your certificates</li>
                <li>✓ Verify authenticity</li>
                <li>✓ Download and share</li>
                <li>✓ Track your achievements</li>
              </ul>
            </div>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleSubmit}
            disabled={!selectedType || isLoading}
            className="flex-1 h-12 bg-[#21808D] hover:bg-[#1a6370] text-white font-semibold"
          >
            {isLoading ? "Setting up..." : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
