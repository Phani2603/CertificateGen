"use client"

import { useOrgStats } from "@/hooks/useDashboardCache"

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
      textColor: "text-gray-800"
    },
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: MdOutlineEvent,
      textColor: "text-gray-800"
    },
    {
      title: "Total Certificates",
      value: stats.totalCertificates,
      icon: TbCertificate,
      textColor: "text-gray-800"
    },
    {
      title: "This Month",
      value: stats.thisMonthCertificates,
      icon: TbCalendarMonth,
      textColor: "text-gray-800"
    }
  ]

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-500 font-medium">Loading stats...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        return (
          <div key={index} className="flex flex-col gap-1 bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-[14px] font-semibold text-gray-800">{stat.title}</p>
            <p className="text-[36px] font-medium text-gray-900 tracking-tight leading-none mt-2">{stat.value}</p>
          </div>
        )
      })}
    </div>
  )
}

