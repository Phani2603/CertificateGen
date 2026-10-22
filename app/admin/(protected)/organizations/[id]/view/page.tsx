"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  Users,
  Calendar,
  Award,
  Mail,
  Globe,
  Clock,
  Shield,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer,
  Gauge,
  FileSpreadsheet,
  Layers,
} from "lucide-react"
import { TbBuildingBank } from "react-icons/tb"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { AdminBatchParticipantsView } from "@/components/admin/AdminBatchParticipantsView"
import { AdminEventDetailsView } from "@/components/admin/AdminEventDetailsView"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

interface OrgViewData {
  organization: any
  orgType: 'academic' | 'corporate'
  owner: any
  members: any[]
  events: any[]
  certificateHistory: any[]
  invitations: any[]
  stats: {
    totalMembers: number
    totalEvents: number
    totalCertificates: number
  }
  quotaInfo: {
    certificateQuota: number
    certificatesUsed: number
    remaining: number | string
    isUnlimited: boolean
    watermarkDisabledByAdmin: boolean
  } | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AdminOrgViewPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<OrgViewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    members: true,
    events: true,
    history: false,
    invitations: false,
  })

  // In-page navigation and view state
  type AdminOrgActiveView =
    | { type: "overview" }
    | { type: "inspect-batch"; historyId: string; eventName: string; batchId?: string }
    | { type: "inspect-event"; eventId: string; event: any }

  const [activeView, setActiveView] = useState<AdminOrgActiveView>({ type: "overview" })
  const [activeTab, setActiveTab] = useState<string>("members")

  useEffect(() => {
    fetchOrgData()
  }, [resolvedParams.id])

  const fetchOrgData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/organizations/${resolvedParams.id}/view`)
      
      if (res.status === 401) {
        window.location.href = '/admin/login'
        return
      }

      const result = await res.json()

      if (!result.success) {
        setError(result.error || 'Failed to load organization data')
        return
      }

      setData(result)
    } catch (err) {
      console.error("Failed to fetch org data:", err)
      setError("Failed to load organization data")
      toast({
        title: "Error",
        description: "Failed to load organization data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Loading...</h2>
            <p className="text-muted-foreground">Fetching organization data</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-16 bg-gray-100 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Error</h2>
            <p className="text-muted-foreground">{error || 'Organization not found'}</p>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-3 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <p>{error || 'Could not load organization data. It may have been deleted.'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { organization: org, orgType, owner, members, events, certificateHistory, invitations, stats, quotaInfo } = data
  const quotaPercent = quotaInfo && !quotaInfo.isUnlimited && quotaInfo.certificateQuota > 0
    ? Math.round((quotaInfo.certificatesUsed / quotaInfo.certificateQuota) * 100)
    : 0

  // In-page inspection sub-views (Tree navigation)
  if (activeView.type === "inspect-batch") {
    return (
      <div className="space-y-6">
        <AdminBatchParticipantsView
          orgId={resolvedParams.id}
          orgName={org.name}
          historyId={activeView.historyId}
          batchName={activeView.eventName}
          batchId={activeView.batchId}
          allBatches={certificateHistory}
          onBack={() => {
            setActiveView({ type: "overview" })
            setActiveTab("history")
          }}
          onSwitchBatch={(historyId, eventName, batchId) => {
            setActiveView({ type: "inspect-batch", historyId, eventName, batchId })
          }}
        />
      </div>
    )
  }

  if (activeView.type === "inspect-event") {
    return (
      <div className="space-y-6">
        <AdminEventDetailsView
          orgId={resolvedParams.id}
          orgName={org.name}
          event={activeView.event}
          allEvents={events}
          linkedBatches={certificateHistory.filter(
            (h) => h.eventId === activeView.event._id || h.eventName === activeView.event.name
          )}
          onBack={() => {
            setActiveView({ type: "overview" })
            setActiveTab("events")
          }}
          onSwitchEvent={(nextEvent) => {
            setActiveView({ type: "inspect-event", eventId: nextEvent._id, event: nextEvent })
          }}
          onInspectBatch={(historyId, eventName, batchId) => {
            setActiveView({ type: "inspect-batch", historyId, eventName, batchId })
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tree / Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList className="text-xs sm:text-sm">
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/organizations" className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              Organizations
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold text-foreground">
              {org.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/organizations')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 rounded-xl border-2 border-gray-100">
              <AvatarImage src={org.logoUrl} alt={org.name} />
              <AvatarFallback className="rounded-xl bg-[#00D492]/10 text-[#00D492]">
                <TbBuildingBank className="h-7 w-7" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                {org.name}
                <Badge variant={orgType === 'corporate' ? 'secondary' : 'default'} className="ml-1 text-xs">
                  {orgType === 'corporate' ? 'Corporate' : 'Academic'}
                </Badge>
              </h2>
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <Eye className="h-3.5 w-3.5" />
                Admin Read-Only View
                {orgType === 'corporate' && org.slug && (
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-md font-mono">/{org.slug}</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Sandbox indicator */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          <Shield className="h-4 w-4" />
          <span className="font-medium">Sandbox Mode</span>
          <span className="text-amber-600">— No write actions available</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
                <p className="text-xs text-muted-foreground">Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCertificates}</p>
                <p className="text-xs text-muted-foreground">Certificates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {org.createdAt ? new Date(org.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Created</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Details + Quota */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Org Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-400" />
              Organization Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{org.name}</p>
              </div>
              {orgType === 'academic' && org.type && (
                <div>
                  <p className="text-muted-foreground mb-1">Type</p>
                  <p className="font-medium capitalize">{org.type}</p>
                </div>
              )}
              {orgType === 'corporate' && org.slug && (
                <div>
                  <p className="text-muted-foreground mb-1">Slug</p>
                  <p className="font-mono text-xs bg-gray-50 px-2 py-1 rounded w-fit">{org.slug}</p>
                </div>
              )}
              {org.website && (
                <div>
                  <p className="text-muted-foreground mb-1">Website</p>
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    {org.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {org.description && (
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{org.description}</p>
                </div>
              )}
              {orgType === 'academic' && (
                <>
                  {org.city && (
                    <div>
                      <p className="text-muted-foreground mb-1">City</p>
                      <p className="font-medium">{org.city}</p>
                    </div>
                  )}
                  {org.state && (
                    <div>
                      <p className="text-muted-foreground mb-1">State</p>
                      <p className="font-medium">{org.state}</p>
                    </div>
                  )}
                  {org.country && (
                    <div>
                      <p className="text-muted-foreground mb-1">Country</p>
                      <p className="font-medium">{org.country}</p>
                    </div>
                  )}
                  {org.nirfRank && (
                    <div>
                      <p className="text-muted-foreground mb-1">NIRF Rank</p>
                      <p className="font-medium">#{org.nirfRank}</p>
                    </div>
                  )}
                </>
              )}
              {orgType === 'corporate' && (
                <div>
                  <p className="text-muted-foreground mb-1">Visibility</p>
                  <Badge variant={org.isPublic ? 'default' : 'outline'}>
                    {org.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>
              )}
            </div>

            {/* Owner */}
            {owner && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Owner</p>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={owner.image} alt={owner.name} />
                      <AvatarFallback className="text-xs">
                        {owner.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{owner.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{owner.email}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {owner.provider && (
                        <Badge variant="outline" className="text-xs capitalize">{owner.provider}</Badge>
                      )}
                      {owner.isSuspended && (
                        <Badge variant="destructive" className="text-xs">Suspended</Badge>
                      )}
                      {owner.isBlocked && (
                        <Badge variant="destructive" className="text-xs">Blocked</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quota (Corporate) or Additional Info (Academic) */}
        {orgType === 'corporate' && quotaInfo ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gauge className="h-5 w-5 text-gray-400" />
                Certificate Quota
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Usage</span>
                  <span className="font-medium">
                    {quotaInfo.certificatesUsed} / {quotaInfo.isUnlimited ? '∞' : quotaInfo.certificateQuota}
                  </span>
                </div>
                {!quotaInfo.isUnlimited && (
                  <Progress
                    value={quotaPercent}
                    className="h-2"
                  />
                )}
                {quotaInfo.isUnlimited && (
                  <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Unlimited quota enabled
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Remaining</p>
                  <p className="font-medium text-lg">
                    {quotaInfo.isUnlimited ? '∞' : quotaInfo.remaining}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Watermark</p>
                  <Badge variant={quotaInfo.watermarkDisabledByAdmin ? 'outline' : 'default'}>
                    {quotaInfo.watermarkDisabledByAdmin ? 'Disabled by Admin' : 'Enabled'}
                  </Badge>
                </div>
              </div>

              {org.quotaMetadata && (
                <>
                  <Separator />
                  <div className="text-xs text-muted-foreground space-y-1">
                    {org.quotaMetadata.allocatedAt && (
                      <p>Allocated: {new Date(org.quotaMetadata.allocatedAt).toLocaleDateString()}</p>
                    )}
                    {org.quotaMetadata.lastUpdatedAt && (
                      <p>Last Updated: {new Date(org.quotaMetadata.lastUpdatedAt).toLocaleDateString()}</p>
                    )}
                    {org.quotaMetadata.notes && (
                      <p>Notes: {org.quotaMetadata.notes}</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-400" />
                Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-muted-foreground mb-1">Total Events</p>
                  <p className="text-2xl font-bold">{stats.totalEvents}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-muted-foreground mb-1">Certificates Issued</p>
                  <p className="text-2xl font-bold">{stats.totalCertificates}</p>
                </div>
              </div>
              {org.clubs && org.clubs.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Clubs</p>
                  <p className="font-medium">{org.clubs.length} clubs registered</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-sm mb-1">Created</p>
                <p className="font-medium">
                  {org.createdAt ? new Date(org.createdAt).toLocaleString() : '—'}
                </p>
              </div>
              {org.updatedAt && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Last Updated</p>
                  <p className="font-medium">{new Date(org.updatedAt).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="h-4 w-4" />
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5">
            <Calendar className="h-4 w-4" />
            Events ({events.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <Award className="h-4 w-4" />
            Certificates ({certificateHistory.length})
          </TabsTrigger>
          {orgType === 'corporate' && (
            <TabsTrigger value="invitations" className="gap-1.5">
              <Mail className="h-4 w-4" />
              Invitations ({invitations.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Members</CardTitle>
              <CardDescription>
                {members.length === 0 ? 'No members found' : `${members.length} member${members.length > 1 ? 's' : ''} in this organization`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {members.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={member.image} alt={member.name} />
                                <AvatarFallback className="text-xs">
                                  {member.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{member.name}</span>
                              {owner && member._id === owner._id && (
                                <Badge variant="outline" className="text-xs">Owner</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{member.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">{member.userType || '—'}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm capitalize">{member.provider || '—'}</span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
                  No members found in this organization.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Events</CardTitle>
              <CardDescription>
                {events.length === 0 ? 'No events found' : `${events.length} event${events.length > 1 ? 's' : ''} created`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Certificates</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-40 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{event.name}</p>
                              {event.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{event.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {event.date ? new Date(event.date).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-semibold">
                              {event.liveCertificateCount ?? event.certificatesGenerated ?? 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {event.templateS3Key ? (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Uploaded
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-gray-400">
                                None
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveView({
                                  type: "inspect-event",
                                  eventId: event._id,
                                  event,
                                })
                              }}
                              className="h-8 text-xs font-medium text-primary hover:text-primary hover:bg-primary/5"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              Inspect Event
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
                  No events found for this organization.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificate History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Certificate Generation History</CardTitle>
              <CardDescription>
                {certificateHistory.length === 0 ? 'No history found' : `${certificateHistory.length} batch${certificateHistory.length > 1 ? 'es' : ''} generated`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {certificateHistory.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event & Batch</TableHead>
                        <TableHead>Certificates</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Success Rate</TableHead>
                        <TableHead>Generated</TableHead>
                        <TableHead className="w-44 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificateHistory.map((history) => (
                        <TableRow key={history._id}>
                          <TableCell>
                            <p className="font-medium text-sm">{history.eventName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {history.clubName && (
                                <span className="text-xs text-muted-foreground">{history.clubName}</span>
                              )}
                              {history.batchId && (
                                <span className="font-mono text-[11px] text-muted-foreground/80 bg-muted px-1.5 py-0.2 rounded border">
                                  {history.batchId}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-semibold">
                              {history.certificateCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {history.totalSize ? `${(history.totalSize / (1024 * 1024)).toFixed(2)} MB` : '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${history.successRate >= 90 ? 'bg-green-500' : history.successRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                              <span className="text-sm">{history.successRate || 0}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {history.createdAt ? new Date(history.createdAt).toLocaleString() : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setActiveView({
                                  type: "inspect-batch",
                                  historyId: history._id,
                                  eventName: history.eventName,
                                  batchId: history.batchId,
                                })
                              }}
                              className="h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                            >
                              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                              Inspect CSV Data
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
                  No certificate generation history found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab (Corporate only) */}
        {orgType === 'corporate' && (
          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invitations</CardTitle>
                <CardDescription>
                  {invitations.length === 0 ? 'No invitations found' : `${invitations.length} invitation${invitations.length > 1 ? 's' : ''} sent`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invitations.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Invited By</TableHead>
                          <TableHead>Sent</TableHead>
                          <TableHead>Expires</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invitations.map((inv) => (
                          <TableRow key={inv._id}>
                            <TableCell className="font-medium text-sm">{inv.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  inv.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                                  inv.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  inv.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                  'bg-gray-50 text-gray-700 border-gray-200'
                                }`}
                              >
                                {inv.status === 'accepted' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {inv.status === 'pending' && <Timer className="h-3 w-3 mr-1" />}
                                {inv.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                                {inv.status === 'expired' && <Clock className="h-3 w-3 mr-1" />}
                                {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{inv.invitedByEmail}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
                    No invitations found for this organization.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
