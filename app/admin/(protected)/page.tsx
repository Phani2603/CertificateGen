"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Users, Building2, UserCog, LogOut, TrendingUp, FileText, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useIslandAlerts } from "@/components/ui/island-alerts"

export default function AdminDashboard() {
  const router = useRouter()
  const { addAlert } = useIslandAlerts()
  const [stats, setStats] = useState({
    totalUsers: 0,
    individualUsers: 0,
    corporateUsers: 0,
    academicUsers: 0,
    pendingRequests: 0,
    totalOrganizations: 0,
    totalPrivateOrgs: 0,
    totalEvents: 0,
    totalCertificates: 0,
    recentActivity: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  // Poll for new access requests (WebSocket disabled for now)
  useEffect(() => {
    // Poll for new requests
    const pollInterval = setInterval(async () => {
      const currentStats = await fetchStats()
      
      // Check if there are new pending requests
      if (currentStats && currentStats.pendingRequests > stats.pendingRequests) {
        addAlert({
          title: 'New Access Request',
          message: 'A new account upgrade request has been submitted',
          type: 'info',
          duration: 15000,
        })
      }
    }, 10000) // Poll every 10 seconds
    
    return () => clearInterval(pollInterval)
  }, [stats.pendingRequests, addAlert])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()

      if (!response.ok) {
        console.error('Failed to fetch stats:', data.error)
        if (response.status === 401) {
          router.push('/admin/login')
          return null
        }
      }

      if (data.success) {
        setStats(data.stats)
        return data.stats
      } else {
        console.error('Stats fetch unsuccessful:', data.error)
        return null
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-7 h-7 text-red-600" />
            Admin Dashboard
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Complete system overview and control center</p>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <TrendingUp className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="h-28 sm:h-32 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats.totalUsers}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <span>{stats.individualUsers} Individual</span>
              <span>{stats.corporateUsers} Corporate</span>
              <span>{stats.academicUsers} Academic</span>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Organizations</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats.totalOrganizations + stats.totalPrivateOrgs}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <span>{stats.totalOrganizations} Academic</span>
              <span>{stats.totalPrivateOrgs} Corporate</span>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow border-2" style={{ borderColor: stats.pendingRequests > 0 ? '#f97316' : '#e5e7eb' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pending Requests</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats.pendingRequests}</p>
              </div>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${stats.pendingRequests > 0 ? 'from-orange-500 to-orange-600' : 'from-green-500 to-green-600'} rounded-lg flex items-center justify-center shadow-md ${stats.pendingRequests > 0 ? 'animate-pulse' : ''}`}>
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium" style={{ color: stats.pendingRequests > 0 ? '#f97316' : '#10b981' }}>
              {stats.pendingRequests > 0 ? '⚠️ Action Required' : '✓ All caught up'}
            </div>
          </Card>

          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats.totalEvents}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
              Across all organizations
            </div>
          </Card>

          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Certificates Issued</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stats.totalCertificates}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
              System-wide certificates
            </div>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link href="/admin/users">
            <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <UserCog className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Manage Users</span>
              </div>
            </Card>
          </Link>
          <Link href="/admin/organizations">
            <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-l-purple-500">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Organizations</span>
              </div>
            </Card>
          </Link>
          <Link href="/admin/requests">
            <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-l-orange-500">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <span className="font-medium">Access Requests</span>
              </div>
            </Card>
          </Link>
          <Link href="/admin/logs">
            <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-l-gray-500">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="font-medium">Audit Logs</span>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
