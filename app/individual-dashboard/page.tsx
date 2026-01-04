"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import { IndividualHeader } from "@/components/dashboard/individual/IndividualHeader"
import { MyCertificatesSection } from "@/components/dashboard/individual/MyCertificatesSection"
import { AchievementsSection } from "@/components/dashboard/individual/AchievementsSection"
import { ActiveEventsSection } from "@/components/dashboard/individual/ActiveEventsSection"
import { UserTypeSelectionModal } from "@/components/UserTypeSelectionModal"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Building2 } from "lucide-react"

export default function IndividualDashboard() {
  const { data: session, status } = useSession()
  const [showTypeSelection, setShowTypeSelection] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState("")
  const [isSubmittingUpgrade, setIsSubmittingUpgrade] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchUserData() {
      if (status === "authenticated") {
        try {
          const response = await fetch('/api/profile')
          const data = await response.json()
          
          if (data.success) {
            setUserData(data.user)
            
            // Check if user has no type selected (OAuth users)
            if (!data.user.userType) {
              setShowTypeSelection(true)
            } else if (data.user.userType !== 'individual') {
              // Redirect to appropriate dashboard if not individual
              if (data.user.userType === 'corporate') {
                redirect('/create-organization')
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchUserData()
  }, [status])

  const handleUpgradeRequest = async () => {
    if (!upgradeReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the upgrade",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmittingUpgrade(true)
      const res = await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedType: 'corporate',
          reason: upgradeReason
        })
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: "Request Submitted",
          description: "Your request to upgrade to Corporate account has been submitted for approval."
        })
        setIsUpgradeDialogOpen(false)
        setUpgradeReason("")
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit request",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingUpgrade(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f6]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#21808D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    redirect("/login")
  }

  return (
    <>
      <UserTypeSelectionModal 
        isOpen={showTypeSelection} 
        onClose={() => setShowTypeSelection(false)} 
      />
      
      <div className="min-h-screen bg-[#f6f6f6]">
        <IndividualHeader userName={userData?.name || session?.user?.name || "User"} />
        
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex justify-end mb-6">
            <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Upgrade to Corporate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upgrade to Corporate Account</DialogTitle>
                  <DialogDescription>
                    Request to upgrade your account to Corporate status. This will allow you to create organizations and issue certificates.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="reason">Reason for Upgrade</Label>
                    <Textarea
                      id="reason"
                      placeholder="Please tell us why you want to upgrade (e.g., Company Name, Use Case)"
                      value={upgradeReason}
                      onChange={(e) => setUpgradeReason(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUpgradeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpgradeRequest} disabled={isSubmittingUpgrade}>
                    {isSubmittingUpgrade ? "Submitting..." : "Submit Request"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-8">
            <AchievementsSection userId={userData?._id} />
            <ActiveEventsSection userId={userData?._id} />
            <MyCertificatesSection userId={userData?._id} />
          </div>
        </main>
      </div>
    </>
  )
}
