"use client"

import { useSession, signOut } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import DashboardToggle from '@/components/DashboardToggle'
import { UserTypeSelectionModal } from "@/components/UserTypeSelectionModal"
import { SuspensionChecker } from "@/components/SuspensionChecker"
import { useIslandAlerts } from "@/components/ui/island-alerts"
import { useProfile, useDashboardStats } from "@/hooks/useDashboardCache"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UpgradeCard } from "@/components/dashboard/individual/upgrade-card"
import { CertificateInsights } from "@/components/dashboard/individual/certificate-insights"
import { UserProfileCard } from "@/components/dashboard/individual/user-profile-card"
import { MyCertificatesSection } from "@/components/dashboard/individual/MyCertificatesSection"
import Calendar from "@/components/calendar-01"
import { MinimalFooter } from "@/components/minimal-footer"
import { FiUser, FiSettings, FiCreditCard, FiUsers, FiHome, FiChevronRight, FiLogOut } from "react-icons/fi"
import { MdPalette, MdPersonAdd } from "react-icons/md"
import { BsCalendar2Event, BsStars, BsTrophy, BsLightning, BsBell, BsShield } from "react-icons/bs"
import { HiOutlineUserCircle, HiOutlineMail } from "react-icons/hi"
import "@/styles/nature.css"

export default function IndividualDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addAlert } = useIslandAlerts()
  const [showTypeSelection, setShowTypeSelection] = useState(false)
  const [privateOrg, setPrivateOrg] = useState<any>(null)
  
  // Use SWR hooks for data fetching with caching
  const { userData, isLoading: profileLoading, mutate: mutateProfile } = useProfile()
  const { stats: dashboardStats, isLoading: statsLoading } = useDashboardStats()
  
  const isLoading = profileLoading || statsLoading

  // Set privateOrg when userData changes
  useEffect(() => {
    if (userData?.privateOrg) {
      console.log('[Dashboard] Private org data:', userData.privateOrg)
      setPrivateOrg(userData.privateOrg)
    }

    // Show user type selection if not set
    if (userData && !userData.userType) {
      setShowTypeSelection(true)
    }
  }, [userData])

  useEffect(() => {
    if (!userData || status !== 'authenticated') return

    const pollInterval = setInterval(async () => {
      try {
        // Revalidate profile data from cache
        const freshData = await mutateProfile()

        if (freshData?.success && freshData.user) {
          if (freshData.user.userType === 'corporate' && userData?.userType === 'individual') {
            addAlert({
              title: 'Promotion Approved!',
              message: 'Your account has been upgraded to corporate!',
              type: 'success',
              duration: 10000,
            })

            setTimeout(() => {
              window.location.href = '/create-organization'
            }, 2000)

            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.error('Error polling user status:', error)
      }
    }, 5000)

    return () => clearInterval(pollInterval)
  }, [userData, status, addAlert, mutateProfile])

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f6]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background font-montserrat">
      <SuspensionChecker />
      <UserTypeSelectionModal
        isOpen={showTypeSelection}
        onClose={() => setShowTypeSelection(false)}
      />

      {/* Header */}
      <header className="bg-primary border-b border-primary min-h-[301px] md:min-h-[351px] lg:min-h-[401px] flex flex-col relative">
        {/* Top Pill Navigation Bar */}
        <div className="w-full  bg-primary/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
            {/* Logo - Left Side */}
            <Link href="/newlanding/hero-section" className="flex flex-col cursor-pointer group shrink-0">
              <div className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 font-raleway group-hover:opacity-80 transition-opacity leading-tight">
                Certiflo
              </div>
              
            </Link>

            {/* Center - Navigation & Toggle */
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Blog Button - Light bg, no icon, fixed width */}
              <Link 
                href="/blog" 
                className="px-4 sm:px-6 py-1.5 sm:py-2 bg-primary-foreground/90 hover:bg-primary-foreground text-primary rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap w-16 sm:w-20 text-center"
              >
                Blog
              </Link>

              {/* Dashboard Toggle Switch - Only show if user is corporate */}
              {userData?.userType === 'corporate' && (
                <div>
                  {/* Use shared DashboardToggle component for persistent state and animation */}
                  <DashboardToggle userData={userData} privateOrgSlug={userData?.privateOrg?.slug || null} />
                </div>
              )}
            </div>
}
            {/* Avatar Dropdown - Right */}


            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary-foreground/50 focus:ring-offset-2 focus:ring-offset-primary shrink-0">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 border-2 border-primary-foreground/20 cursor-pointer hover:border-primary-foreground/40 transition-colors">
                    <AvatarImage src={userData?.image || session?.user?.image} alt={userData?.name || session?.user?.name} />
                    <AvatarFallback className="bg-primary-foreground text-primary text-xs sm:text-sm font-montserrat">
                      {(userData?.name || session?.user?.name || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 font-montserrat">
                <DropdownMenuLabel className="font-montserrat">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border shrink-0">
                      <AvatarImage src={userData?.image || session?.user?.image} alt={userData?.name || session?.user?.name} />
                      <AvatarFallback className="bg-muted text-foreground text-sm font-montserrat">
                        {(userData?.name || session?.user?.name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate">{userData?.name || session?.user?.name || "User"}</span>
                      <span className="text-xs text-muted-foreground truncate">{userData?.email || session?.user?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer font-montserrat">
                  <FiUser className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/profile#settings")} className="cursor-pointer font-montserrat">
                  <FiSettings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => signOut({ callbackUrl: "/login" })} 
                  className="cursor-pointer font-montserrat text-destructive focus:text-destructive"
                >
                  <FiLogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Breadcrumb - Outside Nav */}
          <nav className="flex items-center text-[10px] sm:text-xs text-primary-foreground/60 font-montserrat gap-1 mb-4">
            <FiHome className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="hover:text-primary-foreground/80 cursor-pointer transition-colors">Home</span>
            <FiChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="text-primary-foreground/80 font-medium">Dashboard</span>
          </nav>

          {/* Main Header Content */}
          <div className="flex-1 flex flex-row items-center justify-between">
            <div className="space-y-2 mb-2 max-w-full lg:max-w-[60%]">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground font-montserrat">
                Dashboard
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-primary-foreground/80 font-montserrat">
                Welcome back, {userData?.name || session?.user?.name || "User"}
              </p>
            </div>
            
            {/* Calendar - Only visible on laptop and above */}
            <div className="hidden lg:block">
              <Calendar />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Section */}
      <div className="px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 lg:-mt-28 relative z-10">
        <div className="max-w-7xl mx-auto lg:max-w-[90%]">
          <div className="bg-card rounded-lg shadow-lg border border-border p-4 sm:p-6 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
              {/* Left Side - 4 Stats Cards */}
              <div className="lg:col-span-4 w-full">
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    {/* Card 1 - Total Events */}
                    <div className="bg-background rounded-lg border border-border p-2 sm:p-2.5 hover:shadow-md transition-shadow">
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                          <BsCalendar2Event className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent-foreground" />
                        </div>
                        <div>
                          <div className="text-[10px] sm:text-xs font-semibold text-foreground font-montserrat mb-0.5">Total Events</div>
                          <div className="text-lg sm:text-xl font-medium text-foreground font-montserrat">{dashboardStats?.stats?.events?.count || 0}</div>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-accent/10 text-accent-foreground mt-1">
                            Last 6 months
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card 2 - Certificates */}
                    <div className="bg-background rounded-lg border border-border p-2 sm:p-2.5 hover:shadow-md transition-shadow">
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                          <BsStars className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent-foreground" />
                        </div>
                        <div>
                          <div className="text-[10px] sm:text-xs font-semibold text-foreground font-montserrat mb-0.5">Certificates</div>
                          <div className="text-lg sm:text-xl font-medium text-foreground font-montserrat">{dashboardStats?.stats?.certificates?.count || 0}</div>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-accent/10 text-accent-foreground mt-1">
                            Last 4 months
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card 3 - Organizations (Corporate Organizations user is part of) */}
                    <div className="bg-background rounded-lg border border-border p-2 sm:p-2.5 hover:shadow-md transition-shadow">
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                          <BsTrophy className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent-foreground" />
                        </div>
                        <div>
                          <div className="text-[10px] sm:text-xs font-semibold text-foreground font-montserrat mb-0.5">Organizations</div>
                          <div className="text-lg sm:text-xl font-medium text-foreground font-montserrat">{dashboardStats?.stats?.organizations?.count || 0}</div>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-accent/10 text-accent-foreground mt-1">
                            Last year
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card 4 - Achievements */}
                    <div className="bg-background rounded-lg border border-border p-2 sm:p-2.5 hover:shadow-md transition-shadow">
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                          <BsLightning className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent-foreground" />
                        </div>
                        <div>
                          <div className="text-[10px] sm:text-xs font-semibold text-foreground font-montserrat mb-0.5">Achievements</div>
                          <div className="text-lg sm:text-xl font-medium text-foreground font-montserrat">{dashboardStats?.stats?.achievements?.count || 0}</div>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-accent/10 text-accent-foreground mt-1">
                            Last 6 months
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Profile Card - Below Stats */}
                  <div className="mt-3 sm:mt-4">
                    <UserProfileCard 
                      name={dashboardStats?.userProfile?.name || userData?.name || session?.user?.name || 'User'}
                      email={dashboardStats?.userProfile?.email || userData?.email || session?.user?.email || ''}
                      image={dashboardStats?.userProfile?.image || userData?.image || session?.user?.image}
                      accountType={dashboardStats?.userProfile?.accountType || 'individual'}
                      joinedDate={dashboardStats?.userProfile?.joinedDate || userData?.createdAt || new Date().toISOString()}
                      profileCompletion={dashboardStats?.userProfile?.profileCompletion || 0}
                      trustScore={dashboardStats?.userProfile?.trustScore || 'Low'}
                      lastActive={dashboardStats?.userProfile?.lastActive || 'Never'}
                      userId={dashboardStats?.userProfile?.userId || userData?._id || ''}
                      isOnline={status === 'authenticated'}
                    />
                  </div>
                </div>

                {/* Right Side - Recent Activity & Upgrade */}
                <div className="lg:col-span-8 w-full">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 bg-background rounded-lg border border-border p-3 sm:p-4 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 gap-1">
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground font-montserrat">Recent Activity</h3>
                        <span className="text-[10px] sm:text-xs text-muted-foreground font-montserrat">Latest user actions</span>
                      </div>
                      <div className="space-y-2 sm:space-y-2.5 max-h-[180px] sm:max-h-[220px] overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                        {dashboardStats?.recentActivity && dashboardStats.recentActivity.length > 0 ? (
                          dashboardStats.recentActivity.slice(0, 5).map((activity: any) => {
                            let IconComponent = BsBell
                            let iconBg = "bg-muted"
                            
                            if (activity.category === 'profile' || activity.action.toLowerCase().includes('profile')) {
                              IconComponent = HiOutlineUserCircle
                            } else if (activity.category === 'security' || activity.action.toLowerCase().includes('security')) {
                              IconComponent = BsShield
                            } else if (activity.category === 'auth' || activity.action.toLowerCase().includes('login') || activity.action.toLowerCase().includes('logout')) {
                              IconComponent = HiOutlineMail
                            } else if (activity.action.toLowerCase().includes('certificate')) {
                              IconComponent = BsStars
                            } else if (activity.action.toLowerCase().includes('event')) {
                              IconComponent = BsCalendar2Event
                            }
                            
                            const formattedDate = new Date(activity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            
                            return (
                              <div key={activity._id} className="flex items-start gap-2 sm:gap-2.5 pb-2 sm:pb-2.5 border-b border-border last:border-0 last:pb-0">
                                <div className={`h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
                                  <IconComponent className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] sm:text-xs lg:text-sm font-medium text-foreground font-montserrat">{activity.action}</p>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground font-montserrat truncate">{activity.description || 'Activity recorded'}</p>
                                </div>
                                <span className="text-[10px] sm:text-xs text-muted-foreground font-montserrat shrink-0 hidden sm:inline">{formattedDate}</span>
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-center py-8 text-muted-foreground text-sm font-montserrat">
                            No recent activity to display
                          </div>
                        )}  
                      </div>
                    </div>

                    {/* Upgrade Card */}
                    <div className="lg:col-span-1 w-full">
                      <UpgradeCard userData={userData} dashboardStats={dashboardStats} />
                    </div>
                  </div>

                  {/* Certificate Insights - Full Width */}
                  <div className="mt-3 sm:mt-4">
                    <CertificateInsights 
                      totalIssued={dashboardStats?.stats?.certificates?.count || 0}
                      eventsCovered={dashboardStats?.stats?.events?.count || 0}
                      activeOrgs={dashboardStats?.stats?.organizations?.count || 0}
                      suspensions={dashboardStats?.stats?.suspensions?.count || 0}
                      trend={dashboardStats?.stats?.certificates?.trend || 0}
                    />
                  </div>
                </div>
              </div>

              {/* My Certificates Section - Full Width Below */}
              <div className="mt-3 sm:mt-4 w-full col-span-1 lg:col-span-12 mb-8">
                <MyCertificatesSection userId={userData?._id} />
              </div>
            </div>

            {/* Footer */}
            <MinimalFooter />
          </div>
        </div>
      </div>
  )
}
