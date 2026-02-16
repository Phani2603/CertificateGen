"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import{TbBuildingBank} from "react-icons/tb"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, MoreHorizontal, ExternalLink, Trash2, Building2, Mail, Phone } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useIslandAlerts } from "@/components/ui/island-alerts"

interface Organization {
  _id: string
  name: string
  orgType: 'academic' | 'corporate'
  logoUrl?: string
  members?: string[]  // For academic orgs
  allowedUsers?: string[]  // For corporate orgs
  createdAt: string
  // Academic specific
  type?: string
  // Corporate specific
  slug?: string
  isPublic?: boolean
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()
  const { addAlert } = useIslandAlerts()

  useEffect(() => {
    fetchOrgs()
  }, [search])

  const fetchOrgs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search,
        type: 'all' // We fetch all and filter client-side for tabs to be snappy
      })

      const res = await fetch(`/api/admin/organizations?${params}`)
      const data = await res.json()

      if (!res.ok && res.status === 401) {
        window.location.href = '/admin/login'
        return
      }

      if (data.success) {
        setOrgs(data.organizations)
      } else {
        console.error('Failed to fetch organizations:', data.error)
      }
    } catch (error) {
      console.error("Failed to fetch organizations", error)
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (orgId: string, orgName: string) => {
    if (!confirm("Are you sure you want to delete this organization? This action cannot be undone.")) return

    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (data.success) {
        addAlert({
          title: 'Organization Deleted',
          message: `Successfully deleted "${orgName}"`,
          type: 'success',
          duration: 5000,
        })
        // Auto-refresh data
        await fetchOrgs()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Failed to delete organization", error)
      addAlert({
        title: 'Delete Failed',
        message: 'Failed to delete organization. Please try again.',
        type: 'error',
        duration: 5000,
      })
    }
  }

  const filteredOrgs = orgs.filter(org => {
    if (activeTab === 'all') return true
    return org.orgType === activeTab
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Organizations</h2>
          <p className="text-muted-foreground">Manage academic and corporate organizations.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Organizations</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="corporate">Corporate</TabsTrigger>
            </TabsList>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Loading organizations...
                      </TableCell>
                    </TableRow>
                  ) : filteredOrgs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No organizations found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrgs.map((org) => (
                      <TableRow key={org._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 rounded-lg">
                              <AvatarImage src={org.logoUrl} alt={org.name} />
                              <AvatarFallback className="rounded-lg">
                                <TbBuildingBank className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{org.name}</div>
                              {org.orgType === 'corporate' && (
                                <div className="text-xs text-muted-foreground">/{org.slug}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={org.orgType === 'academic' ? 'default' : 'secondary'}>
                            {org.orgType === 'academic' ? 'Academic' : 'Corporate'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(org.allowedUsers?.length || org.members?.length || 0)} members
                        </TableCell>
                        <TableCell>
                          {new Date(org.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(org._id)}>
                                Copy ID
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {org.orgType === 'corporate' && (
                                <DropdownMenuItem asChild>
                                  <a href={`/${org.slug}/dashboard`} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" /> View Dashboard
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(org._id, org.name)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Org
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6 text-sm text-blue-900">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a href="mailto:forge@senement.com" className="hover:underline">
                forge@senement.com
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a
                href="https://wa.me/94924 78546"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Chat on WhatsApp
              </a>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  )
}
