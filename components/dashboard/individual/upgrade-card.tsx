"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { HiOfficeBuilding } from "react-icons/hi"
import { IoMdTrophy } from "react-icons/io"
import { FaAward, FaBuilding, FaUsers, FaClock, FaCheckCircle, FaTimesCircle, FaEllipsisV, FaInfoCircle } from "react-icons/fa"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import "@/styles/nature.css"

interface UpgradeCardProps {
    userData?: any
    dashboardStats?: any
}

export function UpgradeCard({ userData, dashboardStats }: UpgradeCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [reason, setReason] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [accessRequest, setAccessRequest] = useState<any>(null)
    const [isLoadingRequest, setIsLoadingRequest] = useState(true)
    const { toast } = useToast()

    // Debug logging for team size
    useEffect(() => {
        if (userData) {
            console.log('[UpgradeCard] userData:', {
                privateOrg: userData.privateOrg,
                allowedUsers: userData.privateOrg?.allowedUsers,
                allowedUsersLength: userData.privateOrg?.allowedUsers?.length
            })
        }
        if (dashboardStats) {
            console.log('[UpgradeCard] dashboardStats:', {
                teamSize: dashboardStats?.stats?.organizations?.teamSize
            })
        }
    }, [userData, dashboardStats])

    // Fetch pending/latest access request
    useEffect(() => {
        const fetchAccessRequest = async () => {
            try {
                const res = await fetch('/api/access-requests')
                const data = await res.json()
                if (data.success && data.requests && data.requests.length > 0) {
                    // Get the most recent request
                    setAccessRequest(data.requests[0])
                }
            } catch (error) {
                console.error('Error fetching access request:', error)
            } finally {
                setIsLoadingRequest(false)
            }
        }
        fetchAccessRequest()
    }, [])

    const handleUpgradeRequest = async () => {
        if (!reason.trim()) {
            toast({
                title: "Error",
                description: "Please provide a reason",
                variant: "destructive"
            })
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/access-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestedType: 'corporate', reason })
            })
            const data = await res.json()
            if (data.success) {
                toast({ title: "Request Submitted", description: "Your request has been sent." })
                setAccessRequest(data.request) // Update local state with new request
                setIsOpen(false)
                setReason("")
            } else {
                throw new Error(data.error)
            }
        } catch (e) {
            toast({ title: "Error", variant: "destructive", description: "Failed to submit." })
        } finally {
            setIsSubmitting(false)
        }
    }

    const isCorporate = userData?.userType === 'corporate'

    // Status badge component
    const getStatusBadge = () => {
        if (!accessRequest) return null
        
        const statusConfig = {
            pending: {
                icon: FaClock,
                label: 'pending',
                variant: 'secondary' as const,
                color: 'text-yellow-600 dark:text-yellow-500'
            },
            approved: {
                icon: FaCheckCircle,
                label: 'Approved',
                variant: 'default' as const,
                color: 'text-green-600 dark:text-green-500'
            },
            denied: {
                icon: FaTimesCircle,
                label: 'Denied',
                variant: 'destructive' as const,
                color: 'text-red-600 dark:text-red-500'
            }
        }
        
        const config = statusConfig[accessRequest.status as keyof typeof statusConfig]
        if (!config) return null
        
        const Icon = config.icon
        
        return (
            <Badge variant={config.variant} className="flex items-center gap-1.5 w-fit">
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        )
    }

    // Corporate user view
    if (isCorporate) {
        const privateOrg = userData?.privateOrg
        const teamSize = dashboardStats?.stats?.organizations?.teamSize || privateOrg?.allowedUsers?.length || 1
        const certificatesCount = dashboardStats?.stats?.certificates?.count || 0
        
        return (
            <Card className="p-4 sm:p-5 border border-border shadow-sm bg-card font-montserrat h-full">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div>
                        <h3 className="font-semibold text-sm sm:text-base text-foreground">Company Overview</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Corporate Account</p>
                    </div>
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FaBuilding className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                        <div className="flex items-center gap-2 mb-2">
                            <HiOfficeBuilding className="h-4 w-4 text-accent-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Organization</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                            {privateOrg?.name || userData?.organization?.name || 'Not Set'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div className="p-2.5 rounded-lg bg-background border border-border">
                            <div className="flex items-center gap-1.5 mb-1">
                                <FaUsers className="h-3 w-3 text-foreground" />
                                <span className="text-[10px] font-semibold text-foreground">Team Size</span>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                                {teamSize}
                            </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-background border border-border">
                            <div className="flex items-center gap-1.5 mb-1">
                                <IoMdTrophy className="h-3 w-3 text-foreground" />
                                <span className="text-[10px] font-semibold text-foreground">Certificates</span>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                                {certificatesCount}
                            </p>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Account Status</span>
                            <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                                Active
                            </Badge>
                        </div>
                    </div>
                </div>
            </Card>
        )
    }

    const popularItems = [
        { name: "Achievement Badge", visits: "10.6K", icon: FaAward },
        { name: "Recognition Award", visits: "4.5K", icon: IoMdTrophy },
        { name: "Excellence Certificate", visits: "3.2K", icon: FaAward },
    ]

    // Individual user view
    return (
        <Card className="p-4 sm:p-5 border border-border shadow-sm bg-card font-montserrat h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                    <h3 className="font-semibold text-sm sm:text-base text-foreground">
                        {accessRequest ? 'Upgrade Status' : 'Upgrade Account'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {accessRequest ? 'Track your request' : 'Go Corporate'}
                    </p>
                </div>
                {accessRequest && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground">
                                <FaEllipsisV className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="px-2 py-1.5">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">Request Details</p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Status</span>
                                        {getStatusBadge()}
                                    </div>
                                    <DropdownMenuSeparator />
                                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <FaInfoCircle className="h-3 w-3 mt-0.5" />
                                        <span className="text-[10px] leading-relaxed">
                                            {accessRequest.status === 'pending' && 'Your request is under review'}
                                            {accessRequest.status === 'approved' && 'Request approved successfully'}
                                            {accessRequest.status === 'denied' && 'Request was not approved'}
                                        </span>
                                    </div>
                                    
                                    {accessRequest.status === 'denied' && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <Button 
                                                onClick={() => {
                                                    setIsOpen(true)
                                                }}
                                                size="sm"
                                                className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs flex items-center justify-center gap-1.5"
                                            >
                                                <HiOfficeBuilding className="w-3 h-3" />
                                                Submit New Request
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {isLoadingRequest ? (
                <div className="flex-1 flex items-center justify-center py-8">
                    <div className="text-center">
                        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-xs text-muted-foreground">Loading...</p>
                    </div>
                </div>
            ) : accessRequest ? (
                // Show request status - simplified view
                <div className="flex-1 flex flex-col">
                    <div className="p-3 sm:p-4 rounded-lg bg-accent/5 border border-accent/10">
                        <div className="space-y-2">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Request Type</p>
                                <p className="text-sm font-semibold text-foreground capitalize">
                                    {accessRequest.requestedType} Account
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Submitted</p>
                                <p className="text-xs font-medium text-foreground">
                                    {new Date(accessRequest.requestedAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>

                            {accessRequest.reason && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Your Reason</p>
                                    <p className="text-xs text-foreground line-clamp-3">
                                        {accessRequest.reason}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto pt-4 text-center">
                        <p className="text-xs text-muted-foreground">
                            Check status in menu options above
                        </p>
                    </div>
                </div>
            ) : (
                // No request exists - show upgrade option
                <div className="flex-1 flex flex-col">
                    <div className="space-y-2 sm:space-y-3 flex-1">
                        {popularItems.map((item, idx) => {
                            const Icon = item.icon
                            return (
                                <div key={idx} className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-accent/10 transition-colors">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-accent-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">{item.name}</h4>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">Certificate Template</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs sm:text-sm font-semibold text-foreground">{item.visits}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full mt-3 sm:mt-4 bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm flex items-center justify-center whitespace-nowrap">
                                <HiOfficeBuilding className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 shrink-0" />
                                <span className="truncate">Upgrade to Corporate</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="font-montserrat">
                            <DialogHeader>
                                <DialogTitle>Request Corporate Upgrade</DialogTitle>
                                <DialogDescription>Tell us why you want to upgrade to a corporate account.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                    <Label>Reason for Upgrade</Label>
                                    <Textarea 
                                        value={reason} 
                                        onChange={(e) => setReason(e.target.value)} 
                                        placeholder="Describe why you need a corporate account..."
                                        rows={4}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                                    Cancel
                                </Button>
                                <Button onClick={handleUpgradeRequest} disabled={isSubmitting}>
                                    {isSubmitting ? "Submitting..." : "Submit Request"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </Card>
    )
}
