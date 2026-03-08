"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminStats } from "@/hooks/useDashboardCache"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Shield,
  Users,
  Building2,
  UserCog,
  LogOut,
  TrendingUp,
  FileText,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Filter,
  ChevronRight,
  Download,
  Activity
} from "lucide-react"
import Link from "next/link"
import { useIslandAlerts } from "@/components/ui/island-alerts"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TbBuildingBank } from "react-icons/tb"
import { QuotaAnalytics } from "@/components/admin/QuotaAnalytics"
import { QuotaAlertBanner } from "@/components/admin/QuotaAlertBanner"

// Define colors
const PRIMARY_COLOR = '#00D492'
const CHART_COLORS = ['#3b82f6', '#f97316', '#a855f7', '#ef4444', '#10b981', '#14b8a6']

export default function AdminDashboard() {
  const router = useRouter()
  const { addAlert } = useIslandAlerts()
  
  // Use SWR hook for cached data fetching
  const { stats, isLoading, mutate: mutateStats } = useAdminStats()
  const [previousPendingRequests, setPreviousPendingRequests] = useState(0)

  // Handle 401 redirects
  useEffect(() => {
    if (!isLoading && !stats) {
      router.push('/admin/login')
    }
  }, [stats, isLoading, router])

  // Poll for new access requests
  useEffect(() => {
    if (stats?.pendingRequests !== undefined) {
      setPreviousPendingRequests(stats.pendingRequests)
    }
  }, [stats?.pendingRequests])

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const updatedData = await mutateStats()
      if (updatedData?.stats?.pendingRequests > previousPendingRequests) {
        addAlert({
          title: 'New Access Request',
          message: 'A new account upgrade request has been submitted',
          type: 'info',
          duration: 15000,
        })
      }
    }, 15000) // Poll every 15s to reduce load

    return () => clearInterval(pollInterval)
  }, [previousPendingRequests, addAlert, mutateStats])

  // Calculate some derived stats for the UI
  const totalOrgs = (stats?.totalOrganizations || 0) + (stats?.totalPrivateOrgs || 0)

  return (
    <div className="space-y-6 pb-8">
      {/* Quota Alert Banner */}
      <QuotaAlertBanner />

      {/* System Status & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Platform overview and performance metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9 hidden sm:flex border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
          <Button className="h-9 hover:bg-[#00D492]/90 text-white border-0 shadow-sm" style={{ backgroundColor: PRIMARY_COLOR }}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm ring-1 ring-black/5 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full", stats?.systemStatus?.database === 'connected' ? 'bg-green-500' : 'bg-red-500')} />
              <div>
                <p className="text-xs font-medium text-gray-500">Database</p>
                <p className="text-sm font-bold text-gray-900 capitalize">{stats?.systemStatus?.database || 'Checking...'}</p>
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-black/5 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full", stats?.systemStatus?.s3 === 'configured' ? 'bg-green-500' : 'bg-orange-500')} />
              <div>
                <p className="text-xs font-medium text-gray-500">Storage (S3)</p>
                <p className="text-sm font-bold text-gray-900 capitalize">{stats?.systemStatus?.s3 === 'configured' ? 'Active' : 'Missing Config'}</p>
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
              <TbBuildingBank className="w-4 h-4 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={(stats?.totalUsers || 0).toLocaleString()}
          subtext="Active accounts"
          trend="+12.5%"
          trendUp={true}
          icon={Users}
          color="blue"
          loading={isLoading}
        />
        <StatsCard
          title="Organizations"
          value={totalOrgs.toLocaleString()}
          subtext="Academic & Corporate"
          trend="-2.1%"
          trendUp={false}
          icon={Building2}
          color="purple"
          loading={isLoading}
        />
        <StatsCard
          title="Certificates"
          value={(stats?.totalCertificates || 0).toLocaleString()}
          subtext="Generated to date"
          trend="+8.2%"
          trendUp={true}
          icon={Shield}
          color="green"
          loading={isLoading}
        />
        <StatsCard
          title="Pending Requests"
          value={(stats?.pendingRequests || 0).toLocaleString()}
          subtext="Requires attention"
          trend={(stats?.pendingRequests || 0) > 0 ? "Action Needed" : "All Clear"}
          trendUp={(stats?.pendingRequests || 0) === 0}
          icon={AlertCircle}
          color="orange"
          loading={isLoading}
        />
      </div>

      {/* Main Chart Section */}
      <Card className="border-none shadow-sm ring-1 ring-black/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">User Growth</CardTitle>
            <CardDescription>New user registrations over the last 12 months</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.monthlyUserGrowth || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PRIMARY_COLOR} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={PRIMARY_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: PRIMARY_COLOR, strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke={PRIMARY_COLOR}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section: Charts & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: User Distribution */}
        <Card className="border-none shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">User Distribution</CardTitle>
            <CardDescription>Breakdown by account type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.userTypeDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(stats?.userTypeDistribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart: Signup Methods */}
        <Card className="border-none shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Signup Methods</CardTitle>
            <CardDescription>Authentication providers used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={stats?.providerStats || []}
                  margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {(stats?.providerStats || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card className="border-none shadow-sm ring-1 ring-black/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
            <CardDescription>Latest system logs and actions</CardDescription>
          </div>
          <Button variant="ghost" className="h-8 text-sm" style={{ color: PRIMARY_COLOR }}>View All <ChevronRight className="w-4 h-4 ml-1" /></Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-gray-100">
                <TableHead className="w-[200px]">User/Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(stats?.recentActivity || []).length > 0 ? (
                (stats?.recentActivity || []).map((log: any) => (
                  <TableRow key={log._id} className="border-b-gray-50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={log.adminId?.image} />
                          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                            {log.adminEmail?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{log.adminId?.name || 'System Admin'}</span>
                          <span className="text-xs text-gray-500">{log.adminEmail}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-gray-600 bg-gray-50 border-gray-200">
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm capitalize">{log.targetType}</TableCell>
                    <TableCell className="text-right text-gray-400 text-sm">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                    No recent activity found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Certificate Quota Management */}
      <QuotaAnalytics />
    </div>
  )
}

function StatsCard({ title, value, subtext, trend, trendUp, icon: Icon, color, loading }: any) {
  if (loading) {
    return <Card className="h-32 animate-pulse bg-gray-100 border-none shadow-none" />
  }

  const colorStyles = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600" },
    green: { bg: "bg-green-50", icon: "text-green-600" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600" },
  }

  // Adjust green color style if needed to match primary
  if (color === 'green') {
    colorStyles.green = { bg: "bg-[#00D492]/10", icon: "text-[#00D492]" }
  }

  const styles = colorStyles[color as keyof typeof colorStyles] || colorStyles.blue

  return (
    <Card className="border-none shadow-sm ring-1 ring-black/5 overflow-hidden relative transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-bold mt-2 text-gray-900">{value}</h3>
          </div>
          <div className={`w-10 h-10 rounded-lg ${styles.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${styles.icon}`} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {/* Mock trend for visualization context if real trend not calculated */}
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full flex items-center", trendUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
            {trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {trend}
          </span>
          <span className="text-xs text-muted-foreground">{subtext}</span>
        </div>
      </CardContent>
    </Card>
  )
}
