"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    ArrowLeft, Mail, Calendar, Building2, Award, History,
    Phone, MapPin, User as UserIcon, Shield, Activity,
    ShieldAlert, FileOutput, Trash2, Ban, RefreshCcw,
    CheckCircle2, XCircle, MoreHorizontal, LayoutDashboard,
    CreditCard, DollarSign, Package, Users, Eye
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { CertificatePreview } from "@/components/CertificatePreview"

interface UserDetails {
    _id: string
    name: string
    email: string
    image?: string
    phone?: string
    bio?: string
    address?: string
    organization?: string
    userType: 'individual' | 'corporate' | 'academic' | null
    isBlocked?: boolean
    isSuspended?: boolean
    suspendedUntil?: string
    createdAt: string
    updatedAt: string
    organizationId?: any
    privateOrgId?: any
    clubs?: any[]
    adminOfClubs?: any[]
}

interface Certificate {
    _id: string
    verificationId: string
    eventName: string
    eventDate: string
    organizationName: string
    clubName: string
    issueDate: string
    isValid: boolean
    imageUrl?: string
    templateS3Key?: string
    fieldConfiguration?: any[]
    eventId?: string
}

interface Event {
    _id: string
    name: string
    description?: string
    date: string
    certificatesGenerated: number
}

interface Organization {
    _id: string
    name: string
    type: string
    city?: string
    state?: string
    logoUrl?: string
}

interface PrivateOrg {
    _id: string
    name: string
    slug: string
    description?: string
    logoUrl?: string
    website?: string
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

interface SessionEntry {
    _id?: string
    action: string
    createdAt: string
    ipAddress?: string
    userAgent?: string
}

export default function UserDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const userId = params.userId as string

    const [user, setUser] = useState<UserDetails | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("overview")
    const [activity, setActivity] = useState<ActivityItem[]>([])
    const [sessions, setSessions] = useState<SessionEntry[]>([])
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    // New state for certificate preview
    const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8

    // New state for comprehensive data
    const [certificates, setCertificates] = useState<{ received: Certificate[], totalReceived: number, totalIssued: number }>({ received: [], totalReceived: 0, totalIssued: 0 })
    const [events, setEvents] = useState<{ created: Event[], total: number }>({ created: [], total: 0 })
    const [organizations, setOrganizations] = useState<{
        academic: { created: Organization[], member: Organization[] },
        corporate: { owned: PrivateOrg[], member: PrivateOrg[] }
    }>({ academic: { created: [], member: [] }, corporate: { owned: [], member: [] } })

    useEffect(() => {
        if (userId) {
            fetchAll()
        }
    }, [userId])

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
                if (data.certificates) setCertificates(data.certificates)
                if (data.events) setEvents(data.events)
                if (data.organizations) setOrganizations(data.organizations)
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
                router.push('/admin/users')
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
            case 'corporate': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            case 'academic': return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
            case 'individual': return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            default: return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
        }
    }

    const getInitials = (name: string, email: string) => {
        if (name) return name.substring(0, 2).toUpperCase()
        if (email) return email.substring(0, 2).toUpperCase()
        return 'U'
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50/50">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-sm text-slate-500">Loading profile...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50/50">
                <div className="text-center">
                    <p className="text-slate-500 mb-4">User not found</p>
                    <Button onClick={() => router.push('/admin/users')}>Back to Users</Button>
                </div>
            </div>
        )
    }

    const totalOrgs = organizations.academic.created.length + organizations.academic.member.length + organizations.corporate.owned.length + organizations.corporate.member.length

    // Stats Array
    const stats = [
        {
            title: "Total Certificates",
            value: certificates.totalReceived,
            change: "+12%", // Mock data for now
            changeType: "positive",
            period: "Last 30 days",
            icon: Award,
        },
        {
            title: "Events Created",
            value: events.total,
            change: "+0%",
            changeType: "neutral",
            period: "Last 30 days",
            icon: Calendar,
        },
        {
            title: "Total Organizations",
            value: totalOrgs,
            change: "+2",
            changeType: "positive",
            period: "Last month",
            icon: Building2,
        },
        {
            title: "Activity Score",
            value: "98%", // Mock
            change: "+5%",
            changeType: "positive",
            period: "Last 7 days",
            icon: Activity,
        },
    ]

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-8">
            {/* Breadcrumb & Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1.5">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin/users">Users</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Details</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h2 className="text-2xl font-bold tracking-tight">User Dashboard</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push('/admin/users')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="default" size="sm">
                                Manage User <MoreHorizontal className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAction('export-data')}>
                                <FileOutput className="mr-2 h-4 w-4" /> Export Data
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('revoke-sessions')}>
                                <Shield className="mr-2 h-4 w-4" /> Revoke Sessions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => {
                                    if (user.isSuspended) {
                                        handleAction('unsuspend')
                                    } else {
                                        const daysRaw = window.prompt('Suspend for how many days?', '7')
                                        if (daysRaw === null) return // Cancelled
                                        const days = parseInt(daysRaw, 10)
                                        const until = new Date(Date.now() + (isNaN(days) ? 7 : days) * 24 * 60 * 60 * 1000)
                                        handleAction('suspend', { suspendUntil: until.toISOString() })
                                    }
                                }}
                            >
                                <ShieldAlert className="mr-2 h-4 w-4" /> {user.isSuspended ? 'Unsuspend User' : 'Suspend User'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleAction(user.isBlocked ? 'unblock' : 'block')}
                            >
                                <Ban className="mr-2 h-4 w-4" /> {user.isBlocked ? 'Unblock User' : 'Block User'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => {
                                    if (confirm('Are you sure?')) handleAction('delete')
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <Card key={index} className="border-none shadow-sm ring-1 ring-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <span className={stat.changeType === 'positive' ? 'text-emerald-600' : 'text-slate-600'}>
                                    {stat.change}
                                </span>{' '}
                                {stat.period}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column: User Profile */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-sm ring-1 ring-slate-200">
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                                <AvatarImage src={user.image} alt={user.name} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                                    {getInitials(user.name, user.email)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <CardTitle className="text-lg">{user.name}</CardTitle>
                                <CardDescription className="flex items-center gap-1.5">
                                    {user.userType || 'Individual'} Account
                                </CardDescription>
                            </div>
                            <div className="ml-auto">
                                {/* Status Indicator */}
                                {user.isSuspended ? (
                                    <span className="flex h-3 w-3 rounded-full bg-red-500 ring-2 ring-red-200" title="Suspended" />
                                ) : user.isBlocked ? (
                                    <span className="flex h-3 w-3 rounded-full bg-slate-500 ring-2 ring-slate-200" title="Blocked" />
                                ) : (
                                    <span className="flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" title="Active" />
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-1">
                                <p className="text-sm font-medium leading-none">Contact Information</p>
                                <div className="text-sm text-muted-foreground grid gap-2 mt-2">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5" /> {user.email}
                                    </div>
                                    {user.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-3.5 w-3.5" /> {user.phone}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <History className="h-3.5 w-3.5" /> Joined {new Date(user.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Profile Completion</span>
                                        <span className="font-medium">85%</span>
                                    </div>
                                    <Progress value={85} className="h-1.5" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Trust Score</span>
                                        <span className="font-medium text-emerald-600">High</span>
                                    </div>
                                    <Progress value={92} indicatorClassName="bg-emerald-500" className="h-1.5 bg-emerald-100" />
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Last Active</p>
                                    <p className="text-sm font-medium">
                                        {sessions.length > 0 ? new Date(sessions[0].createdAt).toLocaleDateString() : 'Never'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">User ID</p>
                                    <p className="text-xs font-mono bg-slate-100 p-1 rounded inline-block">
                                        {user._id.substring(0, 8)}...
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Sessions Reduced */}
                    <Card className="border-none shadow-sm ring-1 ring-slate-200">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">Recent Sessions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {sessions.slice(0, 3).map((session, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
                                            <Shield className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <div className="grid gap-0.5">
                                            <p className="font-medium capitalize">{session.action.replace(/_/g, " ")}</p>
                                            <p className="text-xs text-muted-foreground">{session.ipAddress || 'Unknown IP'}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground text-right">
                                        {new Date(session.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                            {sessions.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No sessions recorded.</p>}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Main Content */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Activity Overview / Certificates Split */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Certificates Summary */}
                        <Card className="border-none shadow-sm ring-1 ring-slate-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Certificate Insights</CardTitle>
                                <CardDescription>Weekly issuance overview</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-4 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                <Award className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Valid</p>
                                                <p className="text-2xl font-bold">{certificates.received.filter(c => c.isValid).length}</p>
                                            </div>
                                        </div>
                                        <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-600" style={{ width: '90%' }}></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                                <Activity className="h-5 w-5 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Events</p>
                                                <p className="text-2xl font-bold">{events.total}</p>
                                            </div>
                                        </div>
                                        <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-600" style={{ width: '60%' }}></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-10 w-10 rounded-lg bg-pink-50 flex items-center justify-center">
                                                <Ban className="h-5 w-5 text-pink-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Suspensions</p>
                                                <p className="text-2xl font-bold">{user.isSuspended ? 'Active' : 'None'}</p>
                                            </div>
                                        </div>
                                        <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-pink-600" style={{ width: user.isSuspended ? '100%' : '0%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity Timeline */}
                        <Card className="border-none shadow-sm ring-1 ring-slate-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Recent Activity</CardTitle>
                                <CardDescription>Latest user actions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[220px] pr-4">
                                    <div className="space-y-6">
                                        {activity.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No recent activity.</p>}
                                        {activity.map((item, i) => (
                                            <div key={i} className="flex gap-4 relative">
                                                {/* Timeline Line */}
                                                {i !== activity.length - 1 && (
                                                    <div className="absolute left-[19px] top-8 bottom-[-16px] w-px bg-slate-200" />
                                                )}

                                                <div className="relative mt-1">
                                                    <div className="h-10 w-10 rounded-full border-2 border-slate-100 bg-white flex items-center justify-center z-10">
                                                        {item.category === 'security' ? (
                                                            <Shield className="h-4 w-4 text-blue-500" />
                                                        ) : item.category === 'content' ? (
                                                            <FileOutput className="h-4 w-4 text-purple-500" />
                                                        ) : (
                                                            <Activity className="h-4 w-4 text-slate-500" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-1 pt-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-medium leading-none capitalize">{item.action.replace(/_/g, ' ')}</p>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                        {item.description || "No specific details available for this action."}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Lists Section using Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white h-full">
                            <CardHeader className="px-6 py-4 border-b">
                                <div className="flex items-center justify-between">
                                    <TabsList className="bg-transparent p-0">
                                        <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground transition-none">
                                            Recents
                                        </TabsTrigger>
                                        <TabsTrigger value="certificates" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground transition-none">
                                            Certificates
                                        </TabsTrigger>
                                        <TabsTrigger value="organizations" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground transition-none">
                                            Organizations
                                        </TabsTrigger>
                                    </TabsList>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-1"
                                        onClick={() => {
                                            if (activeTab === 'overview') setActiveTab('certificates')
                                        }}
                                    >
                                        View All
                                        <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {/* Certificates Tab Content - Replaces "Popular Product" / "Filters" */}
                                <TabsContent value="overview" className="m-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead>Event/Certificate</TableHead>
                                                <TableHead>Organization</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Status</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {certificates.received.slice(0, 5).map((cert) => (
                                                <TableRow key={cert._id}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm">{cert.eventName}</span>
                                                            <span className="text-xs text-muted-foreground line-clamp-1">ID: {cert.verificationId}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {cert.organizationName}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {new Date(cert.issueDate).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant="outline" className={`h-6 ${cert.isValid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                            {cert.isValid ? 'Valid' : 'Revoked'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                            onClick={() => setSelectedCertificate(cert)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {certificates.received.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                        No certificates found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TabsContent>

                                <TabsContent value="certificates" className="m-0">
                                    {/* Full Certs List - Reusing same table structure for now but could be expanded */}
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead>Event/Certificate</TableHead>
                                                <TableHead>Organization</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Status</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {certificates.received.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((cert) => (
                                                <TableRow key={cert._id}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm">{cert.eventName}</span>
                                                            <span className="text-xs text-muted-foreground">{cert.verificationId}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{cert.organizationName}</TableCell>
                                                    <TableCell className="text-sm">{new Date(cert.issueDate).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant="outline" className={cert.isValid ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-red-700 border-red-200 bg-red-50"}>
                                                            {cert.isValid ? 'Valid' : 'Revoked'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                            onClick={() => setSelectedCertificate(cert)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {certificates.received.length > itemsPerPage && (
                                        <div className="flex items-center justify-end space-x-2 py-4 px-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </Button>
                                            <div className="text-sm text-muted-foreground">
                                                Page {currentPage} of {Math.ceil(certificates.received.length / itemsPerPage)}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(certificates.received.length / itemsPerPage)))}
                                                disabled={currentPage === Math.ceil(certificates.received.length / itemsPerPage)}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="organizations" className="m-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead>Organization</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Location/Website</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {[...organizations.academic.created, ...organizations.corporate.owned].map(org => (
                                                <TableRow key={org._id}>
                                                    <TableCell className="font-medium">{org.name}</TableCell>
                                                    <TableCell><Badge variant="secondary">Owner</Badge></TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">{(org as Organization).city || (org as PrivateOrg).website || '-'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {[...organizations.academic.member, ...organizations.corporate.member].map(org => (
                                                <TableRow key={org._id}>
                                                    <TableCell className="font-medium">{org.name}</TableCell>
                                                    <TableCell><Badge variant="outline">Member</Badge></TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">{(org as Organization).city || (org as PrivateOrg).website || '-'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {totalOrgs === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                        No organizations found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TabsContent>
                            </CardContent>
                        </Card>
                    </Tabs>
                </div>
            </div>

            {/* Certificate Preview Dialog */}
            <Dialog open={!!selectedCertificate} onOpenChange={(open) => !open && setSelectedCertificate(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Certificate Preview</DialogTitle>
                        <DialogDescription>
                            Details for certificate ID: {selectedCertificate?.verificationId}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedCertificate && user && (
                        <div className="py-4">
                            <CertificatePreview
                                certificate={{
                                    ...selectedCertificate,
                                    recipientName: user.name,
                                    recipientEmail: user.email,
                                }}
                            />
                            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                                <div>
                                    <span className="text-muted-foreground block text-xs">Event Date</span>
                                    <span className="font-medium">{new Date(selectedCertificate.eventDate || selectedCertificate.issueDate).toLocaleDateString()}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs">Status</span>
                                    <Badge variant={selectedCertificate.isValid ? "outline" : "destructive"} className={selectedCertificate.isValid ? "text-emerald-700 bg-emerald-50 border-emerald-200" : ""}>
                                        {selectedCertificate.isValid ? "Valid" : "Revoked"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
