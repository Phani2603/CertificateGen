"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Settings, LogOut, X, AlertTriangle } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import {
  FamilyDrawerRoot,
  FamilyDrawerTrigger,
  FamilyDrawerContent,
  FamilyDrawerAnimatedWrapper,
  FamilyDrawerAnimatedContent,
  FamilyDrawerViewContent,
  FamilyDrawerOverlay,
  FamilyDrawerPortal,
  useFamilyDrawer,
} from "@/components/ui/family-drawer"

interface Organization {
  id: string
  name: string
  city: string
  state: string
  rank: number
  logoUrl?: string
}

interface OrganizationSectionProps {
  // Organization state (read-only from DB)
  hasOrganization: boolean
  userOrganization: string | null
  userOrganizationLogo: string | null

  // Clubs data (read-only from DB)
  userClubs: string[]
  clubEvents: Record<string, Array<{ id: string, name: string, date: string }>>

  // Modal states
  showJoinOrgModal: boolean
  setShowJoinOrgModal: (show: boolean) => void
  showCreateOrgModal: boolean
  setShowCreateOrgModal: (show: boolean) => void
  showEditOrgModal: boolean
  setShowEditOrgModal: (show: boolean) => void

  // Organizations data
  userCreatedOrgs: Organization[]
  setUserCreatedOrgs: (orgs: Organization[] | ((prev: Organization[]) => Organization[])) => void

  // Clubs modal control
  setShowCreateClubModal: (show: boolean) => void

  // Render clubs section (will be extracted to ClubsSection component)
  renderClubsSection: () => React.ReactNode

  // Database functions
  createOrganization?: (orgData: any) => Promise<any>
  joinOrganization?: (organizationId: string) => Promise<any>
  leaveOrganization?: () => Promise<any>
}

export function OrganizationSection({
  hasOrganization,
  userOrganization,
  userOrganizationLogo,
  userClubs,
  clubEvents,
  showJoinOrgModal,
  setShowJoinOrgModal,
  showCreateOrgModal,
  setShowCreateOrgModal,
  showEditOrgModal,
  setShowEditOrgModal,
  userCreatedOrgs,
  setUserCreatedOrgs,
  setShowCreateClubModal,
  renderClubsSection,
  createOrganization,
  joinOrganization,
  leaveOrganization,
}: OrganizationSectionProps) {
  const [collegeSearch, setCollegeSearch] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [colleges, setColleges] = useState<Organization[]>([])
  const [showLeaveDrawer, setShowLeaveDrawer] = useState(false)

  const handleLeaveOrganization = async () => {
    if (leaveOrganization) {
      const result = await leaveOrganization()
      if (result.success) {
        toast.success('Successfully left the organization')
        setShowLeaveDrawer(false)
      } else {
        toast.error(result.error || 'Failed to leave organization')
      }
    }
  }

  // Leave Organization Drawer Views
  const LeaveWarningView = () => {
    const { setView } = useFamilyDrawer()

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Leave Organization</h2>
          <button
            onClick={() => setShowLeaveDrawer(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          This action cannot be undone
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900 mb-2">Warning: This is a destructive action</p>
              <p className="text-sm text-red-800">
                Leaving <strong>{userOrganization}</strong> will permanently remove you from the organization.
                This action cannot be reversed.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center mt-0.5 flex-shrink-0">
              <X className="h-3 w-3 text-red-500" />
            </div>
            <p className="text-sm text-gray-700">You will be removed from all clubs in this organization</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center mt-0.5 flex-shrink-0">
              <X className="h-3 w-3 text-red-500" />
            </div>
            <p className="text-sm text-gray-700">Your event history will be lost</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center mt-0.5 flex-shrink-0">
              <X className="h-3 w-3 text-red-500" />
            </div>
            <p className="text-sm text-gray-700">You won't be able to access organization resources</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowLeaveDrawer(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            onClick={() => setView("confirm")}
          >
            Continue
          </Button>
        </div>
      </div>
    )
  }

  const LeaveConfirmView = () => {
    const { setView } = useFamilyDrawer()
    const [deleteConfirmText, setDeleteConfirmText] = useState("")
    const isValid = deleteConfirmText === "LEAVE"

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Confirm Leaving</h2>
          <button
            onClick={() => setShowLeaveDrawer(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Type <strong>LEAVE</strong> to confirm this action
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="font-semibold text-red-900 mb-1">This action is permanent</p>
          <p className="text-sm text-red-800">
            To confirm, please type <strong>LEAVE</strong> in the field below.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Type LEAVE to confirm</label>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
            placeholder="LEAVE"
            className="font-mono"
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setView("default")}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Button>
          <Button
            disabled={!isValid}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleLeaveOrganization}
          >
            Leave Organization
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Button>
        </div>
      </div>
    )
  }

  const leaveDrawerViews = {
    default: LeaveWarningView,
    confirm: LeaveConfirmView,
  }

  // Fetch organizations from database when search modal opens
  useEffect(() => {
    if (showJoinOrgModal && colleges.length === 0) {
      console.log('Fetching all organizations from database...')
      // Fetch ALL organizations, not just type=college
      // This includes user-created organizations and seeded colleges
      fetch('/api/organizations?search=')
        .then(res => res.json())
        .then(data => {
          console.log('Organizations API response:', data)
          if (data.success && data.organizations) {
            const formattedColleges = data.organizations.map((org: any) => ({
              id: org._id,
              name: org.name,
              city: org.city || '',
              state: org.state || '',
              rank: org.nirfRank || 0,
              logoUrl: org.logoUrl
            }))
            console.log(`Loaded ${formattedColleges.length} organizations`)
            setColleges(formattedColleges)
          }
        })
        .catch(err => console.error('Failed to fetch organizations:', err))
    }
  }, [showJoinOrgModal, colleges.length])

  // Combine colleges from DB and user-created organizations
  const allOrganizations = [
    ...userCreatedOrgs.map(org => ({
      id: org.id,
      name: org.name,
      city: org.city || 'Custom',
      state: org.state || 'User Created',
      rank: 0,
      logoUrl: org.logoUrl
    })),
    ...colleges
  ]

  // Deduplicate organizations by name (keep first occurrence)
  const uniqueOrganizations = allOrganizations.reduce((acc, org) => {
    if (!acc.find(item => item.name.toLowerCase() === org.name.toLowerCase())) {
      acc.push(org)
    }
    return acc
  }, [] as typeof allOrganizations)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Step 3: No Organization - Prompt to Join or Create */}
      {!hasOrganization && (
        <div className="text-center py-8 md:py-16 px-4">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6  rounded-xl md:rounded-2xl flex items-center justify-center">
            <Image
              src="/cflo1.svg"
              alt="CertificateHash Logo"
              width={42}
              height={42}
              className="md:w-34 md:h-34"

            />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-8xl font-semibold mb-3 md:mb-4">Welcome to Forge!</h2>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
            To start generating certificates, you need to join or create an organization.
          </p>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
            {/* Step 4: Join Existing Organization */}
            <Card className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-[#21808D] transition-all cursor-pointer" onClick={() => setShowJoinOrgModal(true)}>
              <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4  flex items-center justify-center">
                <Image
                  src="/12.svg"
                  alt="Join Organization Icon"
                  width={64}
                  height={64}

                />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2">Join Organization</h3>
              <p className="text-lg md:text-lg lg:text-xl text-gray-600 mb-4">Search and join your college, university, or company</p>
              <Button className="w-full bg-[#8FD6BD] hover:bg-[#7bc5ac] text-gray-900">
                Browse Organizations
              </Button>
            </Card>

            {/* Step 4: Create New Organization */}
            <Card className="p-6 md:p-8 bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-[#21808D] transition-all cursor-pointer" onClick={() => setShowCreateOrgModal(true)}>
              <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 flex items-center justify-center">
                <Image
                  src="/11.svg"
                  alt="Create Organization Icon"
                  width={64}
                  height={64}
                />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2">Create Organization</h3>
              <p className="text-sm md:text-base text-gray-600 mb-4">Create a new organization if yours doesn't exist</p>
              <Button className="w-full bg-[#FF5733] hover:bg-[#e64d2a] text-white">
                Create New
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Step 5 & 6: Has Organization - Show Clubs */}
      {hasOrganization && (
        <div>
          {/* Organization Header */}
          <Card className="bg-white p-6 md:p-8 rounded-2xl shadow-md mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                {userOrganizationLogo ? (
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden bg-white shadow-sm">
                    <img src={userOrganizationLogo} alt={userOrganization || 'Organization'} className="w-full h-full object-contain p-1" />
                  </div>
                ) : (
                  <div className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-[#21808D] to-[#1a6570] rounded-2xl flex items-center justify-center shrink-0">
                    <Image
                      src="/11.svg"
                      alt="Organization Icon"
                      width={64}
                      height={64}
                    />

                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg md:text-2xl truncate">{userOrganization || "Your Organization"}</h3>
                  <p className="text-sm md:text-lg text-gray-500">Organization Member</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 md:p-3 hover:bg-blue-50 rounded-lg transition-colors group shrink-0"
                  onClick={() => setShowEditOrgModal(true)}
                  title="Edit Organization"
                >
                  <Settings className="h-5 w-5 md:h-6 md:w-6 text-blue-500 group-hover:text-blue-600" />
                </button>
                <button
                  className="p-2 md:p-3 hover:bg-red-50 rounded-lg transition-colors group shrink-0"
                  onClick={() => setShowLeaveDrawer(true)}
                  title="Leave Organization"
                >
                  <LogOut className="h-5 w-5 md:h-6 md:w-6 text-red-500 group-hover:text-red-600" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <div className="p-3 md:p-4 bg-gradient-to-br from-[#FF5733] to-[#ff7a59] rounded-lg md:rounded-xl text-white text-center">
                <div className="text-xl md:text-2xl font-bold">1</div>
                <div className="text-[10px] md:text-xs opacity-90">Members</div>
              </div>
              <div className="p-3 md:p-4 bg-gradient-to-br from-[#8FD6BD] to-[#a8e0cd] rounded-lg md:rounded-xl text-gray-900 text-center">
                <div className="text-xl md:text-2xl font-bold">{userClubs.length}</div>
                <div className="text-[10px] md:text-xs opacity-80">Your Clubs</div>
              </div>
              <div className="p-3 md:p-4 bg-gradient-to-br from-[#F4E04D] to-[#f7e878] rounded-lg md:rounded-xl text-gray-900 text-center">
                <div className="text-xl md:text-2xl font-bold">{Object.values(clubEvents).reduce((total, events) => total + events.length, 0)}</div>
                <div className="text-[10px] md:text-xs opacity-80">Events</div>
              </div>
            </div>
          </Card>

          {/* Step 5 & 6: Browse and Join Clubs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {renderClubsSection()}
          </div>
        </div>
      )}

      {/* Join Organization Modal */}
      {showJoinOrgModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <Card className="bg-white p-4 md:p-8 rounded-2xl max-w-3xl w-full max-h-[85vh] md:max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-2xl md:text-3xl font-bold truncate">Join an Organization</h2>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  Search across all organizations including colleges, universities, and companies
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowJoinOrgModal(false)
                setCollegeSearch("")
              }}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by college name, city, or state..."
                className="pl-10 text-base"
                value={collegeSearch}
                onChange={(e) => setCollegeSearch(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {uniqueOrganizations
                .filter(college =>
                  (collegeSearch === '' ||
                    college.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
                    college.city.toLowerCase().includes(collegeSearch.toLowerCase()) ||
                    college.state.toLowerCase().includes(collegeSearch.toLowerCase()))
                  && college.name !== userOrganization  // Don't show current organization
                )
                .slice(0, 20)
                .map((college, i) => (
                  <div key={college.id} className="flex items-center gap-2 md:gap-3 p-3 md:p-4 border-2 border-gray-100 rounded-lg hover:border-[#21808D] transition-all group">
                    {college.logoUrl ? (
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-white shadow-sm">
                        <img src={college.logoUrl} alt={college.name} className="w-full h-full object-contain p-1" onError={(e) => {
                          // Hide image and show fallback icon if logo fails to load
                          e.currentTarget.style.display = 'none'
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-[#21808D] to-[#1a6570] rounded-lg flex items-center justify-center"><svg class="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div>'
                          }
                        }} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 md:w-12 md:h-12  flex items-center justify-center shrink-0">
                        <Image
                          src="/11.svg"
                          alt="Organization Icon"
                          width={64}
                          height={64}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-semibold text-sm md:text-base line-clamp-1 flex-1" title={college.name}>{college.name}</h4>
                        {college.rank > 0 ? (
                          <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 bg-[#21808D]/10 text-[#21808D] rounded-full shrink-0 font-medium">#{college.rank}</span>
                        ) : (
                          <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 bg-green-100 text-green-700 rounded-full shrink-0 font-medium">Custom</span>
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-gray-500 truncate">{college.city}, {college.state}</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#21808D] hover:bg-[#1a6570] text-white shrink-0 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2"
                      disabled={isJoining}
                      onClick={async () => {
                        if (joinOrganization && createOrganization) {
                          setIsJoining(true)
                          try {
                            // First, try to find if this organization exists in DB
                            const searchRes = await fetch(`/api/organizations?search=${encodeURIComponent(college.name)}`)
                            const searchData = await searchRes.json()

                            let orgId = null
                            if (searchData.success && searchData.organizations?.length > 0) {
                              // Found existing organization
                              const existingOrg = searchData.organizations.find((org: any) =>
                                org.name.toLowerCase() === college.name.toLowerCase()
                              )
                              if (existingOrg) {
                                orgId = existingOrg._id
                              }
                            }

                            // If not found, create it first
                            if (!orgId) {
                              const createResult = await createOrganization({
                                name: college.name,
                                type: college.rank > 0 ? 'college' : 'custom',
                                city: college.city,
                                state: college.state,
                                logoUrl: college.logoUrl,
                              })

                              if (createResult.success) {
                                orgId = createResult.organization._id
                              } else {
                                throw new Error(createResult.error || 'Failed to create organization')
                              }
                            }

                            // Now join the organization
                            if (orgId) {
                              const result = await joinOrganization(orgId)
                              if (result.success) {
                                setShowJoinOrgModal(false)
                                setCollegeSearch("")
                              } else {
                                toast.error(result.error || 'Failed to join organization')
                              }
                            }
                          } catch (error) {
                            console.error('Failed to join organization:', error)
                            toast.error('Failed to join organization. Please try again.')
                          } finally {
                            setIsJoining(false)
                          }
                        }
                      }}
                    >
                      {isJoining ? 'Joining...' : 'Join'}
                    </Button>
                  </div>
                ))}
              {uniqueOrganizations
                .filter(college =>
                  (collegeSearch === '' ||
                    college.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
                    college.city.toLowerCase().includes(collegeSearch.toLowerCase()) ||
                    college.state.toLowerCase().includes(collegeSearch.toLowerCase()))
                  && college.name !== userOrganization
                ).length === 0 && (
                  <div className="text-center py-12">
                    <Image src="/11.svg" alt="No colleges found" width={64} height={64} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 mb-2">No colleges found</p>
                    <p className="text-sm text-gray-400">Try a different search term or create your organization</p>
                  </div>
                )}
            </div>
            <div className="mt-6 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full border-[#21808D] text-[#21808D] hover:bg-[#21808D] hover:text-white"
                onClick={() => {
                  setShowJoinOrgModal(false)
                  setShowCreateOrgModal(true)
                  setCollegeSearch("")
                }}
              >
                Can't find your organization? Create New
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Create Organization Modal */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <Card className="bg-white p-4 md:p-8 rounded-2xl max-w-2xl w-full max-h-[85vh] md:max-h-auto overflow-y-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-bold">Create New Organization</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateOrgModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const form = e.currentTarget // Store reference before async
              const orgName = formData.get('orgName') as string
              const orgType = formData.get('orgType') as string
              const orgWebsite = formData.get('orgWebsite') as string
              const orgDescription = formData.get('orgDescription') as string
              const orgLogoUrl = formData.get('orgLogoUrl') as string
              const orgCity = formData.get('orgCity') as string || ''
              const orgState = formData.get('orgState') as string || ''

              if (createOrganization) {
                setIsCreating(true)
                try {
                  const result = await createOrganization({
                    name: orgName,
                    type: orgType.toLowerCase(),
                    city: orgCity,
                    state: orgState,
                    website: orgWebsite,
                    description: orgDescription,
                    logoUrl: orgLogoUrl
                  })

                  if (result.success) {
                    setShowCreateOrgModal(false)
                    form.reset()
                  } else {
                    toast.error(result.error || 'Failed to create organization')
                  }
                } catch (error) {
                  console.error('Failed to create organization:', error)
                  toast.error('Failed to create organization. Please try again.')
                } finally {
                  setIsCreating(false)
                }
              }
            }}>
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Organization Logo URL</label>
                  <Input
                    type="url"
                    name="orgLogoUrl"
                    placeholder="https://example.com/logo.png"
                    className="text-sm md:text-base"
                  />
                  <p className="text-xs text-gray-500 mt-1">Provide a web URL for your organization's logo</p>
                </div>
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Organization Name *</label>
                  <Input
                    name="orgName"
                    placeholder="e.g., IIT Bombay, Google India"
                    className="text-sm md:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">Organization Type</label>
                  <select name="orgType" className="w-full p-2 border border-gray-300 rounded-lg text-sm md:text-base">
                    <option>University</option>
                    <option>College</option>
                    <option>Company</option>
                    <option>Non-Profit</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">City (Optional)</label>
                    <Input
                      name="orgCity"
                      placeholder="e.g., Mumbai, Bangalore"
                      className="text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">State (Optional)</label>
                    <Input
                      name="orgState"
                      placeholder="e.g., Maharashtra, Karnataka"
                      className="text-sm md:text-base"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Website (Optional)</label>
                  <Input
                    type="url"
                    name="orgWebsite"
                    placeholder="https://example.com"
                    className="text-base"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="orgDescription"
                    className="w-full p-3 border border-gray-300 rounded-lg text-base"
                    rows={4}
                    placeholder="Tell us about your organization..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCreateOrgModal(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#21808D] hover:bg-[#1a6570] text-white"
                    disabled={isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Create Organization'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Organization Modal */}
      {showEditOrgModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <Card className="bg-white p-4 md:p-8 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-bold">Edit Organization</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowEditOrgModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              setIsCreating(true)
              const formData = new FormData(e.currentTarget)
              try {
                const updatedName = formData.get('orgName') as string
                const updatedLogo = formData.get('orgLogo') as string

                // Get organization ID from the database
                const profileRes = await fetch('/api/profile')
                const profileData = await profileRes.json()
                const organizationId = profileData.user?.organization?.id

                if (!organizationId) {
                  toast.error('Organization ID not found')
                  return
                }

                const response = await fetch('/api/organizations', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    organizationId,
                    name: updatedName,
                    logoUrl: updatedLogo || undefined,
                  }),
                })

                const result = await response.json()

                if (result.success) {
                  toast.success('Organization updated successfully!')
                  setShowEditOrgModal(false)
                  // Refresh the page to show updated data
                  window.location.reload()
                } else {
                  toast.error(result.error || 'Failed to update organization')
                }
              } catch (error) {
                console.error('Failed to update organization:', error)
                toast.error('Failed to update organization. Please try again.')
              } finally {
                setIsCreating(false)
              }
            }}>
              <div className="space-y-4 md:space-y-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Organization Name</label>
                  <Input
                    type="text"
                    name="orgName"
                    defaultValue={userOrganization || ''}
                    placeholder="Enter organization name"
                    className="text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Logo URL (Optional)</label>
                  <Input
                    type="url"
                    name="orgLogo"
                    defaultValue={userOrganizationLogo || ''}
                    placeholder="https://example.com/logo.png"
                    className="text-base"
                  />
                  {userOrganizationLogo && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Current Logo:</p>
                      <img src={userOrganizationLogo} alt="Current logo" className="h-16 object-contain" />
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowEditOrgModal(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#21808D] hover:bg-[#1a6570] text-white"
                    disabled={isCreating}
                  >
                    {isCreating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Leave Organization Family Drawer */}
      <FamilyDrawerRoot
        views={leaveDrawerViews}
        open={showLeaveDrawer}
        onOpenChange={setShowLeaveDrawer}
      >
        <FamilyDrawerPortal>
          <FamilyDrawerOverlay />
          <FamilyDrawerContent>
            <FamilyDrawerAnimatedWrapper>
              <FamilyDrawerAnimatedContent>
                <FamilyDrawerViewContent />
              </FamilyDrawerAnimatedContent>
            </FamilyDrawerAnimatedWrapper>
          </FamilyDrawerContent>
        </FamilyDrawerPortal>
      </FamilyDrawerRoot>
    </div>
  )
}
