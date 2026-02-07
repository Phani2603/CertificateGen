"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { ProfileSection } from "@/components/dashboard/individual/ProfileSection"
import { FiHome, FiChevronRight } from "react-icons/fi"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background font-montserrat">
      {/* Header */}
      <header className="bg-primary border-b border-primary min-h-[202px] md:min-h-[242px] flex flex-col relative">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Top Row: Breadcrumb and Back Link */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            {/* Breadcrumb */}
            <nav className="flex items-center text-sm text-primary-foreground/70 font-montserrat">
              <FiHome className="h-4 w-4 mr-2" />
              <Link href="/individual-dashboard" className="hover:text-primary-foreground cursor-pointer transition-colors">
                Dashboard
              </Link>
              <FiChevronRight className="h-4 w-4 mx-2" />
              <span className="text-primary-foreground font-medium">Profile</span>
            </nav>

            {/* Back Link */}
            <Link 
              href="/individual-dashboard" 
              className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-primary-foreground/20 mb-3 sm:mb-4"></div>

          {/* Main Header Content */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground font-montserrat">
                Profile
              </h1>
              <p className="text-base sm:text-lg text-primary-foreground/80 font-montserrat mb-2">
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Section */}
      <div className="px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 relative z-10 pb-8 pt-4">
        <div className="w-full sm:w-[95%] md:w-[90%] lg:w-4/5 mx-auto">
          <ProfileSection />
        </div>
      </div>
    </div>
  )
}
