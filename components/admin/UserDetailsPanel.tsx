"use client"

import { useState, useEffect, useMemo } from "react"
import { X, Mail, Calendar, Building2, Award, History, Link as LinkIcon, Phone, MapPin, Clock, User as UserIcon, Shield, Activity, ShieldAlert, FileOutput, Trash2, Ban, RefreshCcw } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2,AlertTriangle,XCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface UserDetails {
  _id: string
  name: string
  email: string
  image?: string
  phone?: string
  bio?: string
  userType: 'individual' | 'corporate' | 'academic' | null
  isBlocked?: boolean
  isSuspended?: boolean
  suspendedUntil?: string
  createdAt: string
  updatedAt: string
}

interface ActivityItem {
  _id?: string
  action: string
  description?: string
  category?: string
  actorEmail?: string
  createdAt: string
  meta?: Record<string, any>
  source: 'admin' | 'user'
}

interface ActivitySummaries {
  orgs: {
    academicCreated: number
    academicJoined: number
    corporateOwned: number
    corporateMember: number
    lastOrg: string | null
  }
  events: {
    createdCount: number
    lastEvent: string | null
  }
  certificates: {
    batches: number
    totalGenerated: number
    lastBatch: string | null
  }
}

interface SessionEntry {
  _id?: string
  action: string
  createdAt: string
  ipAddress?: string
  userAgent?: string
}

interface UserDetailsPanelProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export const UserDetailsPanel = ({ userId, isOpen, onClose }: UserDetailsPanelProps) => {
  const [user, setUser] = useState<UserDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [summaries, setSummaries] = useState<ActivitySummaries | null>(null)
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      fetchAll()
    }
  }, [userId, isOpen])

  const fetchAll = async () => {
    setIsLoading(true)
    await Promise.all([fetchUserDetails(), fetchActivity(), fetchSessions()])
    setIsLoading(false)
  }

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
    }
  }

  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/activity`)
      const data = await response.json()
      if (data.success) {
        const userActivities: ActivityItem[] = (data.activity || []).map((item: any) => ({
          _id: item._id,
          action: item.action,
          description: item.description,
          category: item.category,
          actorEmail: item.actorEmail,
          createdAt: item.createdAt,
          meta: item.meta,
          source: item.source || 'user',
        }))
        setActivity(userActivities)
        if (data.summaries) {
          setSummaries(data.summaries)
        }
      }
    } catch (error) {
      console.error('Error fetching activity:', error)
    }
  }

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/sessions`)
      const data = await response.json()
      if (data.success) {
        const sessionEvents: SessionEntry[] = (data.sessions || []).map((item: any) => ({
          _id: item._id,
          action: item.action,
          createdAt: item.createdAt,
          ipAddress: item.ipAddress,
          userAgent: item.userAgent,
        }))
        setSessions(sessionEvents)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const handleAction = async (action: string, payload: Record<string, any> = {}) => {
    try {
      setActionLoading(action)
      const response = await fetch(`/api/admin/users/${userId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      })
      const data = await response.json()
      if (!data.success) {
        alert(data.error || 'Action failed')
        return
      }
      await fetchUserDetails()
      await fetchActivity()
      await fetchSessions()
      if (action === 'delete') {
        alert('User deleted')
        onClose()
        return
      }
      if (action === 'export-data') {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${user?.email || 'user'}-export.json`
        link.click()
        URL.revokeObjectURL(url)
      }
      alert(data.message || 'Action completed')
    } catch (error) {
      console.error('Action error:', error)
      alert('Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const getTypeColor = (type: string | null) => {
    switch (type) {
      case 'corporate':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'academic':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'individual':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getInitials = (name: string, email: string) => {
    if (name) return name.substring(0, 2).toUpperCase()
    if (email) return email.substring(0, 2).toUpperCase()
    return 'U'
  }

  if (!isOpen) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isLoading ? 'Loading...' : user ? user.name : 'User Details'}
          </SheetTitle>
          <SheetDescription>
            {isLoading ? 'Please wait...' : user ? user.email : 'User not found'}
          </SheetDescription>
        </SheetHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-full py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : user ? (
          <>
            <div className="flex items-center gap-4 mb-4 mt-4">
              <Avatar className="h-16 w-16 ring-2 ring-slate-200 ring-offset-2">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white text-lg">
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
            </div>
            
            {/* User Type Badge */}
            <div className="flex gap-2 mb-4">
              <Badge className={`${getTypeColor(user.userType)} px-3 py-1`} variant="outline">
                <Shield className="w-3 h-3 mr-1" />
                <span className="capitalize font-semibold">
                  {user.userType || 'No Type'}
                </span>
              </Badge>
            </div>

            <div className="mt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="sessions">Sessions</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  {/* Personal Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Full Name</span>
                        <span className="text-sm font-medium">{user.name}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Email</span>
                        <span className="text-sm font-medium">{user.email}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">User ID</span>
                        <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                          {user._id.substring(0, 12)}...
                        </span>
                      </div>
                      {user.phone && (
                        <>
                          <Separator />
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Phone</span>
                            <span className="text-sm font-medium">{user.phone}</span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Organization Snapshot */}
                  {summaries && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Organization Footprint
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-1">
                          <p className="text-slate-500">Academic created</p>
                          <p className="text-lg font-semibold">{summaries.orgs.academicCreated}</p>
                          <p className="text-slate-500">Academic joined</p>
                          <p className="text-lg font-semibold">{summaries.orgs.academicJoined}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-500">Corporate owned</p>
                          <p className="text-lg font-semibold">{summaries.orgs.corporateOwned}</p>
                          <p className="text-slate-500">Corporate member</p>
                          <p className="text-lg font-semibold">{summaries.orgs.corporateMember}</p>
                        </div>
                        {summaries.orgs.lastOrg && (
                          <div className="col-span-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded">
                            Last org activity: {summaries.orgs.lastOrg}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Activity Snapshot */}
                  {summaries && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Events & Certificates
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-slate-500">Events created</p>
                          <p className="text-lg font-semibold">{summaries.events.createdCount}</p>
                          {summaries.events.lastEvent && (
                            <p className="text-xs text-slate-600 mt-1">Latest: {summaries.events.lastEvent}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-slate-500">Certificates issued</p>
                          <p className="text-lg font-semibold">{summaries.certificates.totalGenerated}</p>
                          <p className="text-xs text-slate-600 mt-1">Batches: {summaries.certificates.batches}</p>
                          {summaries.certificates.lastBatch && (
                            <p className="text-xs text-slate-600">Last: {summaries.certificates.lastBatch}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Account Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Account Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Account Type</span>
                        <Badge className={`${getTypeColor(user.userType)} text-xs`}>
                          {user.userType || 'Not Set'}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Joined</span>
                        <span className="text-sm font-medium">
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Last Updated</span>
                        <span className="text-sm font-medium">
                          {new Date(user.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {user.bio && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold">Bio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-700">{user.bio}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="activity" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Recent Activity & Audit
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {activity.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No activity recorded yet</p>
                        </div>
                      )}
                      {activity.map((item) => (
                        <div key={item._id || item.createdAt} className="flex items-start justify-between rounded-md border border-slate-200 p-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <Activity className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium capitalize">{item.action.replace(/_/g, ' ')}</p>
                              {item.description && <p className="text-xs text-slate-600">{item.description}</p>}
                              {item.actorEmail && <p className="text-xs text-slate-500 mt-1">By {item.actorEmail}</p>}
                            </div>
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(item.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sessions" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Session History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {sessions.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No session events yet</p>
                        </div>
                      )}
                      {sessions.map((session) => (
                        <div key={session._id || session.createdAt} className="flex items-start justify-between rounded-md border border-slate-200 p-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <ShieldAlert className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium capitalize">{session.action.replace(/_/g, ' ')}</p>
                              {session.ipAddress && <p className="text-xs text-slate-600">IP: {session.ipAddress}</p>}
                              {session.userAgent && <p className="text-xs text-slate-600">UA: {session.userAgent}</p>}
                            </div>
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(session.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="justify-start"
                          disabled={actionLoading === 'block'}
                          onClick={() => handleAction('block')}
                        >
                          <Ban className="w-4 h-4 mr-2" /> Block
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start"
                          disabled={actionLoading === 'unblock'}
                          onClick={() => handleAction('unblock')}
                        >
                          <RefreshCcw className="w-4 h-4 mr-2" /> Unblock
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start"
                          disabled={actionLoading === 'suspend'}
                          onClick={() => {
                            const daysRaw = window.prompt('Suspend for how many days?', '7')
                            const days = daysRaw ? parseInt(daysRaw, 10) : 7
                            const until = new Date(Date.now() + (isNaN(days) ? 7 : days) * 24 * 60 * 60 * 1000)
                            handleAction('suspend', { suspendUntil: until.toISOString() })
                          }}
                        >
                          <ShieldAlert className="w-4 h-4 mr-2" /> Suspend
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start"
                          disabled={actionLoading === 'unsuspend'}
                          onClick={() => handleAction('unsuspend')}
                        >
                          <RefreshCcw className="w-4 h-4 mr-2" /> Unsuspend
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start"
                          disabled={actionLoading === 'revoke-sessions'}
                          onClick={() => handleAction('revoke-sessions')}
                        >
                          <Shield className="w-4 h-4 mr-2" /> Revoke Sessions
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start"
                          disabled={actionLoading === 'export-data'}
                          onClick={() => handleAction('export-data')}
                        >
                          <FileOutput className="w-4 h-4 mr-2" /> Export Data
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start text-red-600"
                          disabled={actionLoading === 'delete'}
                          onClick={() => {
                            if (window.confirm('Delete this user? This cannot be undone.')) {
                              handleAction('delete')
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete User
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full py-20">
            <div className="text-center">
              <p className="text-slate-500">User not found</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}


