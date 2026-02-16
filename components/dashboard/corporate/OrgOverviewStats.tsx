"use client"

import { useOrgStats } from "@/hooks/useDashboardCache"
import { Card } from "@/components/ui/card"
import { TbCertificate, TbCalendarMonth, TbBuildingBank } from "react-icons/tb"
import { MdOutlineEvent } from "react-icons/md"
import { HiOutlineUsers } from "react-icons/hi"

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
      icon: HiOutlineUsers,
      textColor: "text-blue-600"
    },
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: MdOutlineEvent,
      textColor: "text-[#21808D]"
    },
    {
      title: "Total Certificates",
      value: stats.totalCertificates,
      icon: TbCertificate,
      textColor: "text-purple-600"
    },
    {
      title: "This Month",
      value: stats.thisMonthCertificates,
      icon: TbCalendarMonth,
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
              <div>
                <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.textColor}`} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
