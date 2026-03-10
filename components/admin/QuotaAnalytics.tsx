"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { QuotaManagement } from "@/components/admin/QuotaManagement"
import { Search, Infinity, TrendingUp, Award, AlertTriangle, Building2, ChevronLeft, ChevronRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface Organization {
  _id: string
  name: string
  slug: string
  certificateQuota: number
  certificatesUsed: number
  allowedUsers: any[]
  ownerId: any
}

export function QuotaAnalytics() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Calculate paginated data
  const totalPages = Math.ceil(filteredOrgs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOrgs = filteredOrgs.slice(startIndex, endIndex)

  const fetchOrganizations = async () => {
    try {
      console.log('[QuotaAnalytics] Fetching organizations...')
      const response = await fetch('/api/admin/organizations/list')
      const result = await response.json()
      
      console.log('[QuotaAnalytics] API Response:', result)
      console.log('[QuotaAnalytics] Organizations count:', result.organizations?.length)

      if (result.success) {
        const orgs = result.organizations || []
        console.log('[QuotaAnalytics] Organizations:', orgs)
        setOrganizations(orgs)
        setFilteredOrgs(orgs)
        
        // Calculate stats
        const totalOrgs = orgs.length
        const unlimitedOrgs = orgs.filter((o: Organization) => (o.certificateQuota ?? -1) === -1).length
        const limitedOrgs = totalOrgs - unlimitedOrgs
        const totalUsed = orgs.reduce((sum: number, o: Organization) => sum + (o.certificatesUsed ?? 0), 0)
        const totalQuota = orgs
          .filter((o: Organization) => (o.certificateQuota ?? -1) !== -1)
          .reduce((sum: number, o: Organization) => sum + (o.certificateQuota ?? 0), 0)
        
        // Organizations at risk (>80% usage)
        const atRisk = orgs.filter((o: Organization) => {
          const quota = o.certificateQuota ?? -1
          const used = o.certificatesUsed ?? 0
          if (quota === -1) return false
          return quota > 0 && (used / quota) >= 0.8
        }).length

        setStats({
          totalOrgs,
          unlimitedOrgs,
          limitedOrgs,
          totalUsed,
          totalQuota,
          atRisk,
        })
      } else {
        console.error('[QuotaAnalytics] API Error:', result.error)
      }
    } catch (error) {
      console.error('[QuotaAnalytics] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrgs(organizations)
      setCurrentPage(1) // Reset to first page
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = organizations.filter(org =>
      org.name.toLowerCase().includes(query) ||
      org.slug.toLowerCase().includes(query)
    )
    setFilteredOrgs(filtered)
    setCurrentPage(1) // Reset to first page when search changes
  }, [searchQuery, organizations])

  const getQuotaStatus = (org: Organization) => {
    const quota = org.certificateQuota ?? -1
    const used = org.certificatesUsed ?? 0

    if (quota === -1) {
      return { percentage: null, status: 'unlimited', color: 'blue' }
    }

    const percentage = quota > 0 ? (used / quota) * 100 : 100
    
    if (percentage >= 95) return { percentage, status: 'critical', color: 'red' }
    if (percentage >= 80) return { percentage, status: 'warning', color: 'orange' }
    if (percentage >= 50) return { percentage, status: 'moderate', color: 'yellow' }
    return { percentage, status: 'healthy', color: 'green' }
  }

  if (loading) {
    return (
      <Card className="border-none shadow-sm ring-1 ring-black/5">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm ring-1 ring-black/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Organizations</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalOrgs || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Corporate accounts</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-black/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Certificates</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalUsed?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Generated to date</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-black/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unlimited Plans</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.unlimitedOrgs || 0}</p>
                <p className="text-xs text-gray-400 mt-1">No restrictions</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Infinity className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-black/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">At Risk</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.atRisk || 0}</p>
                <p className="text-xs text-gray-400 mt-1">&gt;80% quota used</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card className="border-none shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Organization Quotas</CardTitle>
              <CardDescription>Manage certificate generation limits</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Quota</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrgs.length > 0 ? (
                paginatedOrgs.map((org) => {
                  const status = getQuotaStatus(org)
                  const quota = org.certificateQuota ?? -1
                  const used = org.certificatesUsed ?? 0
                  const available = quota === -1 ? -1 : Math.max(0, quota - used)

                  return (
                    <TableRow key={org._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{org.name}</span>
                          <span className="text-xs text-gray-500">{org.slug}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {quota === -1 ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            <Infinity className="w-3 h-3 mr-1" />
                            Unlimited
                          </Badge>
                        ) : (
                          <span className="font-mono text-sm">{quota.toLocaleString()}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-900">
                        {used.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-600">
                        {available === -1 ? '∞' : available.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {status.status === 'unlimited' ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            No Limit
                          </Badge>
                        ) : (
                          <div className="space-y-1 min-w-[120px]">
                            <div className="flex items-center justify-between text-xs">
                              <span className={
                                status.color === 'red' ? 'text-red-600 font-medium' :
                                status.color === 'orange' ? 'text-orange-600 font-medium' :
                                status.color === 'yellow' ? 'text-yellow-600 font-medium' :
                                'text-green-600'
                              }>
                                {status.percentage?.toFixed(0)}%
                              </span>
                              <span className="text-gray-500 capitalize">{status.status}</span>
                            </div>
                            <Progress value={status.percentage || 0} className="h-1.5" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <QuotaManagement
                          organizationSlug={org.slug}
                          organizationName={org.name}
                          currentQuota={quota}
                          onQuotaUpdated={fetchOrganizations}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                    {searchQuery ? 'No organizations found matching your search' : 'No organizations yet'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination Controls */}
          {filteredOrgs.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4 border-t">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(endIndex, filteredOrgs.length)}</span> of{" "}
                  <span className="font-medium">{filteredOrgs.length}</span> organizations
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Rows per page:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={itemsPerPage} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 25, 50, 100].map((pageSize) => (
                        <SelectItem key={pageSize} value={pageSize.toString()}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1 px-2">
                    <span className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> of{" "}
                      <span className="font-medium">{totalPages}</span>
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
