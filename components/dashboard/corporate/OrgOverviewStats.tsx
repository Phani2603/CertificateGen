"use client"

import { useOrgStats } from "@/hooks/useDashboardCache"
import { Card } from "@/components/ui/card"
import { Users, Award, Calendar, TrendingUp } from "lucide-react"

interface OrgOverviewStatsProps {
  organizationId: string
  memberCount: number
}

export function OrgOverviewStats({ organizationId, memberCount }: OrgOverviewStatsProps) {
  const { events, history, isLoading } = useOrgStats(organizationId)

  // Calculate stats from SWR data
  const totalCertificates = history.reduce((sum: number, item: any) => 
    sum + (item.certificateCount || 0), 0
  )

  // This month certificates
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthCertificates = history
    .filter((item: any) => new Date(item.date) >= firstDayOfMonth)
    .reduce((sum: number, item: any) => sum + (item.certificateCount || 0), 0)

  const stats = {
    totalMembers: memberCount,
    totalEvents: events.length,
    totalCertificates,
    thisMonthCertificates
  }

  const statCards = [
    {
      title: "Total Members",
      value: stats.totalMembers,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: Calendar,
      color: "from-[#21808D] to-[#2a9faf]",
      bgColor: "bg-[#21808D]/10",
      textColor: "text-[#21808D]"
    },
    {
      title: "Total Certificates",
      value: stats.totalCertificates,
      icon: Award,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "This Month",
      value: stats.thisMonthCertificates,
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    }
  ]

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#21808D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading stats...</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="p-4 sm:p-5 border-2 border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bgColor} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.textColor}`} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
