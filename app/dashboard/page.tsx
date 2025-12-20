"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu } from "lucide-react"
import { saveSession, loadSession, clearSession, hasValidSession } from "@/utils/storage"
import { useDashboardData } from "@/hooks/useDashboardData"
import {
  DashboardSidebar,
  OrganizationSection,
  ClubsSection,
  EventModals,
  CreateClubModal,
  GenerateCertificatesSection,
  HistorySection,
  ProfileSettings,
} from "@/components/dashboard"
import type { CertificateField } from "@/types/certificate"

type Step = "upload" | "configure" | "generate"
type Page = "generate" | "history" | "settings" | "organizations"

interface AppState {
  templateImage: string | null
  fields: CertificateField[]
  csvData: Array<Record<string, string>>
}

interface HistoryItem {
  id: string
  eventName: string
  clubName: string
  count: number
  date: string
  timestamp: number
  successRate: number
  totalSize: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Use centralized dashboard data hook
  const {
    loading: dashboardLoading,
    profile,
    organization,
    clubs,
    userClubIds,
    events,
    history,
    pagination,
    fetchHistory,
    createOrganization,
    joinOrganization,
    createClub,
    joinClub,
    createEvent,
    addHistoryEntry,
    updateProfile,
    leaveOrganization,
    leaveClub,
  } = useDashboardData()

  // Page & UI state
  const [currentPage, setCurrentPage] = useState<Page>("organizations")
  const [currentStep, setCurrentStep] = useState<Step>("upload")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Modal states
  const [showJoinOrgModal, setShowJoinOrgModal] = useState(false)
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false)
  const [showEditOrgModal, setShowEditOrgModal] = useState(false)
  const [showCreateClubModal, setShowCreateClubModal] = useState(false)
  const [showClubDetailModal, setShowClubDetailModal] = useState(false)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [showHistoryDetailModal, setShowHistoryDetailModal] = useState(false)
  
  // Selected items
  const [selectedClub, setSelectedClub] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<{club: string, eventId: string, eventName: string} | null>(null)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null)
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined)
  
  // User created organizations (separate from DB colleges)
  const [userCreatedOrgs, setUserCreatedOrgs] = useState<Array<{id: string, name: string, city: string, state: string, rank: number, logoUrl?: string}>>([])
  
  // Derive state from DB hook data
  const hasOrganization = !!organization
  const userOrganization = organization?.name || null
  const userOrganizationLogo = organization?.logoUrl || null
  const hasClubMembership = userClubIds.length > 0
  const userClubs = clubs.filter(c => userClubIds.includes(c._id?.toString() || '')).map(c => c.name)
  const availableClubs = clubs.map(c => ({
    id: c._id?.toString() || '',
    name: c.name,
    members: c.members?.length || 0,
    color: c.color || '#3B82F6',
    logoUrl: c.logoUrl
  }))
  const clubEvents = events
  
  // Certificate generation state
  const [appState, setAppState] = useState<AppState>({
    templateImage: null,
    fields: [],
    csvData: [],
  })
  
  // Profile form state
  const [profileName, setProfileName] = useState("")
  const [profileEmail, setProfileEmail] = useState("")
  const [profilePhone, setProfilePhone] = useState("")
  const [profileBio, setProfileBio] = useState("")
  const [profileImageUrl, setProfileImageUrl] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  
  // Generation history (temp localStorage until fully migrated)
  const [generationHistory, setGenerationHistory] = useState<HistoryItem[]>([])

  // Sync profile from hook data
  useEffect(() => {
    if (profile) {
      setProfileName(profile.name || "")
      setProfileEmail(profile.email || "")
      setProfilePhone(profile.phone || "")
      setProfileBio(profile.bio || "")
      setProfileImageUrl(profile.image || "")
    } else if (session?.user) {
      setProfileEmail(session.user.email || "")
      setProfileName(session.user.name || "")
      setProfileImageUrl(session.user.image || "")
    }
  }, [profile, session])

  // Sync history from hook
  useEffect(() => {
    if (history && history.length > 0) {
      const mappedHistory = history.map((h: any) => ({
        id: h._id || h.id,
        eventName: h.eventName,
        clubName: h.clubName,
        count: h.certificateCount,
        date: new Date(h.createdAt).toLocaleDateString(),
        timestamp: new Date(h.createdAt).getTime(),
        successRate: h.successRate || 100,
        totalSize: h.totalSize || '0 KB'
      }))
      setGenerationHistory(mappedHistory)
    }
  }, [history])

  // Restore certificate generation session
  useEffect(() => {
    if (hasValidSession()) {
      const session = loadSession()
      const restoredState: AppState = {
        templateImage: session.templateImage || null,
        fields: session.fields || [],
        csvData: session.csvData || [],
      }
      setAppState(restoredState)
      if (session.currentStep === 1) setCurrentStep("upload")
      else if (session.currentStep === 2) setCurrentStep("configure")
      else if (session.currentStep === 3) setCurrentStep("generate")
    }
  }, [])

  // Data is now managed by DB hook - no localStorage needed

  // Save certificate generation session
  useEffect(() => {
    const stepNumber = currentStep === "upload" ? 1 : currentStep === "configure" ? 2 : 3
    saveSession({
      currentStep: stepNumber,
      templateImage: appState.templateImage || "",
      fields: appState.fields,
      csvData: appState.csvData,
    })
  }, [currentStep, appState])

  // Add generation to history - now connected to database
  const addToHistory = async (eventName: string, clubName: string, count: number, totalSizeBytes: number) => {
    // Get club ID and event ID from selectedEvent
    if (!selectedEvent) return
    
    const result = await addHistoryEntry({
      eventId: selectedEvent.eventId,
      eventName: eventName,
      clubId: selectedEvent.club,
      clubName: clubName,
      certificateCount: count,
      totalSize: totalSizeBytes,
      batchId: `batch-${Date.now()}`,
    })
    
    if (result.success) {
      console.log('[History] Entry saved to database')
      // Refresh history from database
      await fetchHistory()
    } else {
      console.error('[History] Failed to save:', result.error)
    }
  }

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // Handle profile save
  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          bio: profileBio,
          image: profileImageUrl,
          organization: userOrganization || '',
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Profile updated successfully!')
      } else {
        alert('Failed to update profile. Please try again.')
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      alert('Error saving profile. Please try again.')
    }
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

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar Component */}
      <DashboardSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        selectedEvent={selectedEvent}
        userImage={session?.user?.image}
        userName={session?.user?.name}
        userEmail={session?.user?.email}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen p-2 md:p-4 w-full md:w-auto relative z-10">
        {/* Top Header - Active Event Only */}
        <header className="flex items-center justify-between gap-3 md:gap-4 mb-3 md:mb-4 px-2 md:px-4 py-2 mt-16 md:mt-2">
          {/* Selected Event Indicator */}
          {selectedEvent ? (
            <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></div>
              <div className="text-xs md:text-sm flex-1 min-w-0">
                <span className="text-gray-500 hidden sm:inline">Active Event: </span>
                <span className="font-semibold text-gray-900 truncate">{selectedEvent.eventName}</span>
              </div>
            </div>
          ) : (
            <div />
          )}
          
          {/* Avatar */}
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
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-white rounded-t-3xl shadow-sm">
          {/* Loading State - Prevents flash of welcome page */}
          {dashboardLoading && currentPage === "organizations" ? (
            <div className="max-w-6xl mx-auto text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#21808D] mx-auto mb-4"></div>
              <p className="text-gray-500 text-lg">Loading your organization...</p>
            </div>
          ) : (
            <>
              {currentPage === "generate" && (
                <GenerateCertificatesSection
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  appState={appState}
                  setAppState={setAppState}
                  selectedEvent={selectedEvent}
                  onAddToHistory={addToHistory}
                  organization={organization}
                  clubs={availableClubs}
                />
              )}

          {currentPage === "history" && (
            <HistorySection
              generationHistory={history.map((h: any) => ({
                id: h._id || h.id,
                eventName: h.eventName,
                clubName: h.clubName,
                count: h.certificateCount || h.count,
                date: h.createdAt ? new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : h.date,
                timestamp: h.createdAt ? new Date(h.createdAt).getTime() : h.timestamp,
                successRate: h.successRate || 100,
                totalSize: h.totalSize,
              }))}
              showHistoryDetailModal={showHistoryDetailModal}
              setShowHistoryDetailModal={setShowHistoryDetailModal}
              selectedHistoryItem={selectedHistoryItem}
              setSelectedHistoryItem={setSelectedHistoryItem}
            />
          )}

          {currentPage === "organizations" && (
            <OrganizationSection
              hasOrganization={hasOrganization}
              userOrganization={userOrganization}
              userOrganizationLogo={userOrganizationLogo}
              userClubs={userClubs}
              clubEvents={clubEvents}
              showJoinOrgModal={showJoinOrgModal}
              setShowJoinOrgModal={setShowJoinOrgModal}
              showCreateOrgModal={showCreateOrgModal}
              setShowCreateOrgModal={setShowCreateOrgModal}
              showEditOrgModal={showEditOrgModal}
              setShowEditOrgModal={setShowEditOrgModal}
              userCreatedOrgs={userCreatedOrgs}
              setUserCreatedOrgs={setUserCreatedOrgs}
              setShowCreateClubModal={setShowCreateClubModal}
              createOrganization={createOrganization}
              joinOrganization={joinOrganization}
              leaveOrganization={leaveOrganization}
              renderClubsSection={() => (
                <ClubsSection
                  userClubs={userClubs}
                  availableClubs={availableClubs}
                  clubEvents={clubEvents}
                  setSelectedClub={setSelectedClub}
                  setShowClubDetailModal={setShowClubDetailModal}
                  setShowCreateClubModal={setShowCreateClubModal}
                  joinClub={joinClub}
                  leaveClub={leaveClub}
                />
              )}
            />
          )}

          {currentPage === "settings" && (
            <ProfileSettings
              profileName={profileName}
              setProfileName={setProfileName}
              profileEmail={profileEmail}
              setProfileEmail={setProfileEmail}
              profilePhone={profilePhone}
              setProfilePhone={setProfilePhone}
              profileBio={profileBio}
              setProfileBio={setProfileBio}
              profileImageUrl={profileImageUrl}
              setProfileImageUrl={setProfileImageUrl}
              userOrganization={userOrganization}
              isSavingProfile={isSavingProfile}
              setIsSavingProfile={setIsSavingProfile}
              onSaveProfile={handleSaveProfile}
            />
          )}
            </>
          )}
        </div>
      </main>

      {/* Event Modals */}
      <EventModals
        showClubDetailModal={showClubDetailModal}
        setShowClubDetailModal={setShowClubDetailModal}
        showCreateEventModal={showCreateEventModal}
        setShowCreateEventModal={setShowCreateEventModal}
        selectedClub={selectedClub}
        setSelectedClub={setSelectedClub}
        clubEvents={clubEvents}
        availableClubs={availableClubs}
        selectedEvent={selectedEvent}
        setSelectedEvent={setSelectedEvent}
        setCurrentPage={setCurrentPage}
        userClubs={userClubs}
        userOrganization={userOrganization}
        eventDate={eventDate}
        setEventDate={setEventDate}
        leaveClub={leaveClub}
        createEvent={createEvent}
      />

      {/* Create Club Modal */}
      <CreateClubModal
        showCreateClubModal={showCreateClubModal}
        setShowCreateClubModal={setShowCreateClubModal}
        hasOrganization={hasOrganization}
        userClubs={userClubs}
        availableClubs={availableClubs}
        createClub={createClub}
      />
    </div>
  )
}
