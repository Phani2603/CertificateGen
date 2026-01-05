"use client"

import { useState, useEffect } from "react"
import { X, Mail, Calendar, Building2, Award, History, Link as LinkIcon, Phone, MapPin, Clock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UserDetails {
  _id: string
  name: string
  email: string
  image?: string
  phone?: string
  bio?: string
  userType: 'individual' | 'corporate' | 'academic' | null
  createdAt: string
  updatedAt: string
  provider?: string
  organization?: {
    name: string
    logoUrl?: string
  }
  privateOrg?: {
    name: string
    slug: string
    logoUrl?: string
  }
  clubs?: Array<{
    name: string
    color?: string
  }>
  adminOfClubs?: Array<{
    name: string
  }>
  // Additional stats
  totalCertificates?: number
  totalEvents?: number
  lastActivity?: string
}

interface UserDetailsPanelProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export function UserDetailsPanel({ userId, isOpen, onClose }: UserDetailsPanelProps) {
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails()
    }
  }, [userId, isOpen])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      setError("")
      const res = await fetch(`/api/admin/users/${userId}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch user details')
      }

      setUser(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-[#21808D] to-[#1a6370] text-white">
            <h2 className="text-2xl font-bold">User Details</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#21808D]"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-red-600 font-medium mb-2">Error loading user details</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button onClick={fetchUserDetails} className="mt-4">Retry</Button>
                </div>
              </div>
            ) : user ? (
              <div className="space-y-6">
                {/* Profile Section */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="h-32 w-32 ring-4 ring-[#21808D]/20">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback className="text-3xl bg-[#21808D] text-white">
                      {user.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-2xl font-bold">{user.name}</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                    {user.userType && (
                      <Badge className="mt-2 capitalize" variant="secondary">
                        {user.userType}
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Tabs */}
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="info">Info</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="orgs">Organizations</TabsTrigger>
                  </TabsList>

                  {/* Info Tab */}
                  <TabsContent value="info" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Email</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Phone</p>
                              <p className="text-sm text-muted-foreground">{user.phone}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {user.bio && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Bio
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{user.bio}</p>
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Account Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Joined</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(user.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        {user.provider && (
                          <div className="flex items-center gap-3">
                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Sign-in Method</p>
                              <p className="text-sm text-muted-foreground capitalize">{user.provider}</p>
                            </div>
                          </div>
                        )}
                        {user.lastActivity && (
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Last Activity</p>
                              <p className="text-sm text-muted-foreground">{user.lastActivity}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Activity Tab */}
                  <TabsContent value="activity" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Certificates
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2">
                            <Award className="h-8 w-8 text-[#21808D]" />
                            <span className="text-3xl font-bold">{user.totalCertificates || 0}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Events
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2">
                            <History className="h-8 w-8 text-[#21808D]" />
                            <span className="text-3xl font-bold">{user.totalEvents || 0}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {user.adminOfClubs && user.adminOfClubs.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Club Admin
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {user.adminOfClubs.map((club, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <Badge variant="outline">{club.name}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Organizations Tab */}
                  <TabsContent value="orgs" className="space-y-4 mt-4">
                    {user.privateOrg && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Private Organization
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-[#21808D]/10 flex items-center justify-center">
                              {user.privateOrg.logoUrl ? (
                                <img src={user.privateOrg.logoUrl} alt={user.privateOrg.name} className="h-10 w-10 object-contain" />
                              ) : (
                                <Building2 className="h-6 w-6 text-[#21808D]" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{user.privateOrg.name}</p>
                              <p className="text-sm text-muted-foreground">/{user.privateOrg.slug}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {user.organization && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Academic Organization
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-[#21808D]/10 flex items-center justify-center">
                              {user.organization.logoUrl ? (
                                <img src={user.organization.logoUrl} alt={user.organization.name} className="h-10 w-10 object-contain" />
                              ) : (
                                <Building2 className="h-6 w-6 text-[#21808D]" />
                              )}
                            </div>
                            <p className="font-medium">{user.organization.name}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {user.clubs && user.clubs.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Club Memberships
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {user.clubs.map((club, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                {club.color && (
                                  <div 
                                    className="h-3 w-3 rounded-full" 
                                    style={{ backgroundColor: club.color }}
                                  />
                                )}
                                <span className="text-sm">{club.name}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {!user.privateOrg && !user.organization && (!user.clubs || user.clubs.length === 0) && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No organization affiliations</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : null}
          </ScrollArea>
        </div>
      </div>
    </>
  )
}
