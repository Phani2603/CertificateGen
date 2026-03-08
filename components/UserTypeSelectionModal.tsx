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
  const [selectedType, setSelectedType] = useState<"individual" | null>(null)
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

      // Redirect - only individual is allowed for regular users
      if (selectedType === "individual") {
        router.push("/individual-dashboard")
      }
      
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Only allow closing if not loading and onClose is provided
      if (!open && !isLoading && onClose) {
        onClose()
      }
    }}>
      <DialogContent 
        className="sm:max-w-2xl" 
        onInteractOutside={(e) => {
          // Prevent closing by clicking outside
          e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing with escape key
          if (isLoading) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to Certiflo!
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Let's set up your account to get started.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center mt-6">
          {/* Individual Card - Primary option for regular users */}
          <button
            onClick={() => setSelectedType("individual")}
            className={cn(
              "flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all max-w-md w-full",
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
                selectedType === "individual" ? "text-white" : "text-gray-600"
              )} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">Individual</h3>
              <p className="text-sm text-gray-600 mb-3">
                Perfect for freelancers, educators, and event organizers who create certificates individually
              </p>
              <ul className="text-xs text-gray-500 space-y-1 text-left">
                <li>✓ Personal dashboard</li>
                <li>✓ Quick certificate creation</li>
                <li>✓ Template library access</li>
                <li>✓ Unlimited certificates</li>
              </ul>
            </div>
          </button>

          {/* Corporate/Business Card - REMOVED from public signup */}
          {/* Corporate accounts require admin approval */}
          {/* Contact admin for corporate access */}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Need a corporate account?{" "}
            <a href="mailto:admin@getcertificates.com" className="text-[#21808D] hover:underline">
              Contact our team
            </a>
          </p>
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
