"use client"

import { notFound, redirect } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { CorporateOrgSection } from "@/components/dashboard/corporate/CorporateOrgSection"
import { CorporateEventsSection } from "@/components/dashboard/corporate/CorporateEventsSection"
import { CorporateHistorySection } from "@/components/dashboard/corporate/CorporateHistorySection"
import { OrgOverviewStats } from "@/components/dashboard/corporate/OrgOverviewStats"
import { PermissionRequestsSection } from "@/components/dashboard/corporate/PermissionRequestsSection"
import { InvitationsSection } from "@/components/dashboard/corporate/InvitationsSection"
import { CorporateSettings } from "@/components/dashboard/corporate/CorporateSettings"
import { UserTypeSelectionModal } from "@/components/UserTypeSelectionModal"
import { CorporateSidebar, CorporatePage } from "@/components/dashboard/corporate/CorporateSidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface PageProps {
  params: Promise<{
    orgSlug: string
  }>
}

export default function CorporateDashboard({ params }: PageProps) {
  const { data: session, status } = useSession()
  const [showTypeSelection, setShowTypeSelection] = useState(false)
  const [orgData, setOrgData] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [resolvedParams, setResolvedParams] = useState<{ orgSlug: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Sidebar state
  const [currentPage, setCurrentPage] = useState<CorporatePage>("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeEvent, setActiveEvent] = useState<{ eventName: string } | null>(null)

  const handleUpdateSettings = async (data: any) => {
    if (!resolvedParams) return

    const response = await fetch(`/api/private-orgs/${resolvedParams.orgSlug}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error)
    }

    setOrgData(result.organization)
  }

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    async function fetchData() {
      if (status === "authenticated" && resolvedParams) {
        try {
          // Fetch user data
          const userResponse = await fetch('/api/profile')
          const userData = await userResponse.json()

          if (userData.success) {
            setUserData(userData.user)
            console.log('[Dashboard] User data:', userData.user)

            // Check if user has no type selected (OAuth users)
            if (!userData.user.userType) {
              setShowTypeSelection(true)
              setIsLoading(false)
              return
            }

            // Check if user is corporate type
            if (userData.user.userType !== 'corporate') {
              redirect('/individual-dashboard')
            }
          }

          // Fetch organization data
          const orgResponse = await fetch(`/api/private-orgs/${resolvedParams.orgSlug}`)
          const orgData = await orgResponse.json()

          if (!orgData.success) {
            setError(orgData.error || "Organization not found")
            setIsLoading(false)
            return
          }

          // Check if user has access to this organization
          const userId = userData.user.id || userData.user._id
          const ownerId = orgData.organization.ownerId
          const allowedUsers = orgData.organization.allowedUsers || []
          
          console.log('[Dashboard] Owner check:', { 
            ownerId, 
            userId, 
            ownerIdType: typeof ownerId, 
            userIdType: typeof userId,
            areEqual: ownerId === userId,
            areEqualAsString: String(ownerId) === String(userId)
          })
          
          const hasAccess = ownerId === userId || allowedUsers.includes(userId)

          if (!hasAccess) {
            redirect('/create-organization')
          }

          setOrgData(orgData.organization)
        } catch (error) {
          console.error('Error fetching data:', error)
          setError("Failed to load organization data")
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchData()
  }, [status, resolvedParams])

  // Fetch active event (most recent event)
  useEffect(() => {
    async function fetchActiveEvent() {
      if (orgData?._id) {
        try {
          const response = await fetch(`/api/history?privateOrgId=${orgData._id}&limit=1`)
          const data = await response.json()
          if (data.success && data.history && data.history.length > 0) {
            setActiveEvent({ eventName: data.history[0].eventName })
          }
        } catch (error) {
          console.error('Error fetching active event:', error)
        }
      }
    }
    fetchActiveEvent()
  }, [orgData])

  if (status === "loading" || isLoading || !resolvedParams) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f6]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#21808D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    redirect("/login")
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f6f6f6] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-6">
            {error === "Organization not found" 
              ? `We couldn't find an organization with the identifier "${resolvedParams.orgSlug}".`
              : error}
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.reload()} className="w-full bg-[#21808D]">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-white relative text-gray-800 flex">
      {/* Crosshatch Art - Light Pattern */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(22.5deg, transparent, transparent 2px, rgba(75, 85, 99, 0.06) 2px, rgba(75, 85, 99, 0.06) 3px, transparent 3px, transparent 8px),
            repeating-linear-gradient(67.5deg, transparent, transparent 2px, rgba(107, 114, 128, 0.05) 2px, rgba(107, 114, 128, 0.05) 3px, transparent 3px, transparent 8px),
            repeating-linear-gradient(112.5deg, transparent, transparent 2px, rgba(55, 65, 81, 0.04) 2px, rgba(55, 65, 81, 0.04) 3px, transparent 3px, transparent 8px),
            repeating-linear-gradient(157.5deg, transparent, transparent 2px, rgba(31, 41, 55, 0.03) 2px, rgba(31, 41, 55, 0.03) 3px, transparent 3px, transparent 8px)
          `,
        }}
      />

      <UserTypeSelectionModal 
        isOpen={showTypeSelection} 
        onClose={() => setShowTypeSelection(false)} 
      />

      {orgData && (
        <>
          <CorporateSidebar 
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            orgName={orgData.name}
            orgWebsite={orgData.website}
            userImage={session?.user?.image}
            userName={session?.user?.name}
            userEmail={session?.user?.email}
          />

          <main className="flex-1 flex flex-col min-h-screen p-3 sm:p-4 md:p-6 w-full relative z-10">
            {/* Top Header */}
            <header className="flex items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6 px-2 md:px-4 py-2 mt-14 md:mt-2">
              {/* Mobile Menu Button + Org Name / Active Event Indicator */}
              {activeEvent ? (
                <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></div>
                  <div className="text-xs md:text-sm flex-1 min-w-0">
                    <span className="text-gray-500 hidden sm:inline">Active Event: </span>
                    <span className="font-semibold text-gray-900 truncate">{activeEvent.eventName}</span>
                  </div>
                </div>
              ) : (
                <div className="md:hidden flex items-center gap-3">
                  <button 
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-lg text-gray-600"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                  <span className="font-semibold text-gray-900">{orgData.name}</span>
                </div>
              )}
              
              {!activeEvent && <div className="hidden md:block" />}
              
              <Avatar className="w-10 h-10 md:w-12 md:h-12 cursor-pointer ring-2 ring-white shadow-lg" onClick={() => setCurrentPage("settings")} title="Go to Settings">
                {session?.user?.image && (
                  <AvatarImage src={session.user.image} alt={session?.user?.name || "User"} />
                )}
                <AvatarFallback className="bg-[#21808D] text-white text-sm md:text-base">
                  {session?.user?.name ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                </AvatarFallback>
              </Avatar>
            </header>

            {/* Page Content */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-white rounded-t-2xl md:rounded-t-3xl shadow-sm">
              <div className="max-w-7xl mx-auto w-full">
                {currentPage === "overview" && (
                  <div className="space-y-6 md:space-y-8">
                    <CorporateOrgSection 
                      organization={orgData}
                      isOwner={String(orgData.ownerId) === String(userData?.id || userData?._id)}
                    />
                    
                    {/* Stats Overview */}
                    <OrgOverviewStats 
                      organizationId={orgData._id}
                      memberCount={orgData.allowedUsers?.length || 0}
                    />
                    
                    {/* Permission Requests (Owner Only) */}
                    <PermissionRequestsSection 
                      organizationId={orgData._id}
                      isOwner={String(orgData.ownerId) === String(userData?.id || userData?._id)}
                    />
                  </div>
                )}
                
                {currentPage === "events" && (
                  <CorporateEventsSection 
                    organizationId={orgData._id}
                    organizationSlug={orgData.slug}
                    organizationName={orgData.name}
                    isOwner={String(orgData.ownerId) === String(userData?.id || userData?._id)}
                  />
                )}

                {currentPage === "history" && (
                  <CorporateHistorySection 
                    organizationId={orgData._id}
                    organizationName={orgData.name}
                  />
                )}
                
                {currentPage === "members" && (
                  <InvitationsSection 
                    organizationId={orgData._id}
                    organizationSlug={orgData.slug}
                    isOwner={String(orgData.ownerId) === String(userData?.id || userData?._id)}
                  />
                )}

                {currentPage === "settings" && (
                  <CorporateSettings 
                    organization={orgData}
                    onUpdate={handleUpdateSettings}
                  />
                )}
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  )
}