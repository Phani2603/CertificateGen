"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Award, Calendar, TrendingUp, Trophy } from "lucide-react"

interface AchievementsSectionProps {
  userId?: string
}

interface Stats {
  totalCertificates: number
  thisMonth: number
  organizations: number
  categories: number
}

export function AchievementsSection({ userId }: AchievementsSectionProps) {
  const [stats, setStats] = useState<Stats>({
    totalCertificates: 0,
    thisMonth: 0,
    organizations: 0,
    categories: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [userId])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/my-certificates')
      const data = await response.json()

      if (data.success && data.certificates) {
        const certs = data.certificates
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        // Total certificates
        const totalCertificates = certs.length

        // Certificates this month
        const thisMonth = certs.filter((cert: any) => {
          const certDate = new Date(cert.issuedDate)
          return certDate.getMonth() === currentMonth && certDate.getFullYear() === currentYear
        }).length

        // Unique organizations
        const orgsSet = new Set<string>()
        certs.forEach((cert: any) => {
          const orgName = cert.organizationName || cert.privateOrgName
          if (orgName) orgsSet.add(orgName)
        })
        const organizations = orgsSet.size

        // Unique event categories (using event names as categories)
        const eventsSet = new Set<string>()
        certs.forEach((cert: any) => {
          if (cert.eventName) eventsSet.add(cert.eventName)
        })
        const categories = eventsSet.size

        setStats({
          totalCertificates,
          thisMonth,
          organizations,
          categories,
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#21808D] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2 sm:gap-3">
          <Trophy className="w-5 sm:w-6 h-5 sm:h-6 text-[#FF5733]" />
          Your Achievements
        </h2>
        <p className="text-gray-600 text-xs sm:text-sm mt-2">
          Track your learning progress and accomplishments
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="p-4 sm:p-5 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Certificates</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 text-gray-900">{stats.totalCertificates}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#21808D]/10 rounded-lg flex items-center justify-center shrink-0">
              <Award className="w-5 sm:w-6 h-5 sm:h-6 text-[#21808D]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">This Month</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 text-gray-900">{stats.thisMonth}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#8FD6BD]/20 rounded-lg flex items-center justify-center shrink-0">
              <Calendar className="w-5 sm:w-6 h-5 sm:h-6 text-[#8FD6BD]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Organizations</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 text-gray-900">{stats.organizations}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FF5733]/10 rounded-lg flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 sm:w-6 h-5 sm:h-6 text-[#FF5733]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Events</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 text-gray-900">{stats.categories}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
              <Trophy className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
