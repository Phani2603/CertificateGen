"use client"

import { notFound, redirect } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useProfile, usePrivateOrg, useActiveEvent } from "@/hooks/useDashboardCache"
import { CorporateOrgSection } from "@/components/dashboard/corporate/CorporateOrgSection"
import { CorporateEventsSection } from "@/components/dashboard/corporate/CorporateEventsSection"
import { CorporateHistorySection } from "@/components/dashboard/corporate/CorporateHistorySection"
import { OrgOverviewStats } from "@/components/dashboard/corporate/OrgOverviewStats"
import { PermissionRequestsSection } from "@/components/dashboard/corporate/PermissionRequestsSection"
import { InvitationsSection } from "@/components/dashboard/corporate/InvitationsSection"
import { CorporateSettings } from "@/components/dashboard/corporate/CorporateSettings"
import { CorporateProfileContent } from "@/components/dashboard/corporate/CorporateProfileContent"
import { UserTypeSelectionModal } from "@/components/UserTypeSelectionModal"
import { CorporateSidebar, CorporatePage } from "@/components/dashboard/corporate/CorporateSidebar"
import { Menu, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SuspensionChecker } from "@/components/SuspensionChecker"
import { MinimalFooter } from "@/components/minimal-footer"
import DashboardToggle from '@/components/DashboardToggle'

interface PageProps {
  params: Promise<{
    orgSlug: string
  }>
}

export default function CorporateDashboard({ params }: PageProps) {
  const { data: session, status } = useSession()
  const [showTypeSelection, setShowTypeSelection] = useState(false)
  const [resolvedParams, setResolvedParams] = useState<{ orgSlug: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Use SWR hooks for cached data fetching
  const { userData, isLoading: profileLoading, mutate: mutateProfile } = useProfile()
  const { orgData, isLoading: orgLoading, mutate: mutateOrg } = usePrivateOrg(resolvedParams?.orgSlug || null)
  const { activeEvent } = useActiveEvent(orgData?._id || null)
  
  const isLoading = profileLoading || orgLoading

  // Sidebar state
  const [currentPage, setCurrentPage] = useState<CorporatePage>("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pageStorageKey = resolvedParams ? `corp-page-${resolvedParams.orgSlug}` : null

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

    // Revalidate org data in cache
    mutateOrg()
  }

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  // Restore last visited page per org
  useEffect(() => {
    if (!resolvedParams) return
    const stored = localStorage.getItem(`corp-page-${resolvedParams.orgSlug}`)
    if (stored) {
      setCurrentPage(stored as CorporatePage)
    }
  }, [resolvedParams])

  // Validate user access when data is loaded
  useEffect(() => {
    if (status === "authenticated" && userData && orgData && resolvedParams) {
      // Check if user has no type selected (OAuth users)
      if (!userData.userType) {
        setShowTypeSelection(true)
        return
      }

      // Check if user is corporate type
      if (userData.userType !== 'corporate') {
        redirect('/individual-dashboard')
        return
      }

      // Check if user has access to this organization
      const userId = userData.id || userData._id
      const ownerId = orgData.ownerId
      const allowedUsers = orgData.allowedUsers || []

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
    }

    // Handle org data errors
    if (!orgLoading && !orgData && resolvedParams) {
      setError("Organization not found")
    }
  }, [status, userData, orgData, resolvedParams, orgLoading])

  // Persist current page per org
  useEffect(() => {
    if (!resolvedParams) return
    localStorage.setItem(`corp-page-${resolvedParams.orgSlug}`, currentPage)
  }, [currentPage, resolvedParams])

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
            <Button variant="outline" onClick={() => window.location.href = '/individual-dashboard'} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to individual Dashboard
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

      <SuspensionChecker />
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
            userImage={userData?.image || session?.user?.image}
            userName={userData?.name || session?.user?.name}
            userEmail={userData?.email || session?.user?.email}
          />

          <main className="flex-1 flex flex-col min-h-screen p-3 sm:p-4 md:p-6 w-full relative z-10">
            {/* Top Header */}
            <header className="flex items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6 px-2 md:px-4 py-2 mt-14 md:mt-2">
              {/* Left side: Mobile Menu Button + Org Name / Active Event Indicator */}
              <div className="flex items-center gap-2 md:gap-3">
                {/* Mobile Menu Button - Always visible on mobile */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg text-gray-600"
                >
                  <Menu className="h-6 w-6" />
                </button>

                {/* Active Event or Org Name */}
                {activeEvent ? (
                  <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></div>
                    <div className="text-xs md:text-sm flex-1 min-w-0">
                      <span className="text-gray-500 hidden sm:inline">Active Event: </span>
                      <span className="font-semibold text-gray-900 truncate">{activeEvent.eventName}</span>
                    </div>
                  </div>
                ) : (
                  <span className="font-semibold text-gray-900">{orgData.name}</span>
                )}
              </div>

              {/* Center: Dashboard toggle */}
              {userData?.userType === 'corporate' && (
                <DashboardToggle userData={userData} privateOrgSlug={resolvedParams?.orgSlug || orgData?.slug || null} />
              )}

              {/* Right side: Profile */}
              <button 
                onClick={() => setCurrentPage("profile")}
                className="focus:outline-none focus:ring-2 focus:ring-[#21808D] rounded-full"
              >
                <Avatar className="w-10 h-10 md:w-12 md:h-12 cursor-pointer ring-2 ring-white shadow-lg" title="Open profile">
                  {(userData?.image || session?.user?.image) && (
                    <AvatarImage src={userData?.image || session?.user?.image} alt={userData?.name || session?.user?.name || "User"} />
                  )}
                  <AvatarFallback className="bg-[#21808D] text-white text-sm md:text-base">
                    {(userData?.name || session?.user?.name) ? (userData?.name || session?.user?.name || '').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </header>

            {/* Page Content */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-white rounded-t-2xl md:rounded-t-3xl shadow-sm">
              <div className="max-w-7xl mx-auto w-full">
                {currentPage === "overview" && (
                  <div className="space-y-6 md:space-y-8">
                    <CorporateOrgSection
                      organization={orgData}
                      isOwner={String(orgData.ownerId) === String(userData?.id || userData?._id)}
                      onEditClick={() => setCurrentPage("settings")}
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

                {currentPage === "profile" && (
                  <CorporateProfileContent />
                )}
              </div>

              {/* Footer */}
              <div className="mt-8">
                <MinimalFooter />
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  )
}