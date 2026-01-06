"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AccessRequestDetailsPanelProps {
  userId: string
  userEmail: string
  userName?: string
  userImage?: string
  userType?: string
  requestedType: string
  reason: string
  status: 'pending' | 'approved' | 'denied'
  createdAt: string
  onApprove: () => void
  onDeny: () => void
}

export function AccessRequestDetailsPanel({
  userId,
  userEmail,
  userName,
  userImage,
  userType,
  requestedType,
  reason,
  status,
  createdAt,
  onApprove,
  onDeny,
}: AccessRequestDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'denied':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4" />
      case 'denied':
        return <XCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'corporate':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'academic':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'individual':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getInitials = () => {
    if (userName) return userName.substring(0, 2).toUpperCase()
    if (userEmail) return userEmail.substring(0, 2).toUpperCase()
    return 'U'
  }

  const displayName = userName || userEmail || 'Unknown User'

  return (
    <Card className="w-full border-2 shadow-lg">
      <CardHeader className="pb-4 bg-linear-to-r from-slate-50 to-slate-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 ring-2 ring-slate-200 ring-offset-2">
              <AvatarImage src={userImage} alt={displayName} />
              <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                {displayName}
              </CardTitle>
              {userEmail && (
                <CardDescription className="text-slate-600 flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {userEmail}
                </CardDescription>
              )}
            </div>
          </div>
        </div>

        {/* Status and Type Badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className={`${getStatusColor(status)} flex items-center gap-1 px-3 py-1`}>
            {getStatusIcon(status)}
            <span className="capitalize font-semibold">{status}</span>
          </Badge>
          {userType && (
            <Badge className={`${getTypeColor(userType)} px-3 py-1`} variant="outline">
              <Shield className="w-3 h-3 mr-1" />
              <span className="capitalize font-semibold">Current: {userType}</span>
            </Badge>
          )}
          <Badge className={`${getTypeColor(requestedType)} px-3 py-1`} variant="outline">
            <Award className="w-3 h-3 mr-1" />
            <span className="capitalize font-semibold">Requested: {requestedType}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reason">Request Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User Info Card */}
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">User ID</span>
                    <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                      {userId.substring(0, 8)}...
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Email</span>
                    <span className="text-sm font-medium">{userEmail || 'N/A'}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Current Type</span>
                    <Badge className={`${getTypeColor(userType || 'none')} text-xs`}>
                      {userType || 'None'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Request Info Card */}
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Request Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Requested Type</span>
                    <Badge className={`${getTypeColor(requestedType)} text-xs`}>
                      {requestedType}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Status</span>
                    <Badge className={`${getStatusColor(status)} text-xs flex items-center gap-1`}>
                      {getStatusIcon(status)}
                      {status}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Submitted</span>
                    <span className="text-sm font-medium">
                      {new Date(createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reason" className="space-y-4">
            <Card className="border-slate-200 bg-slate-50">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-700">
                  Request Justification
                </CardTitle>
                <CardDescription>
                  Why the user is requesting this account upgrade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32 w-full rounded-md border bg-white p-4">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {reason || "No reason provided"}
                  </p>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-blue-900">
                  Upgrade Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-blue-800">
                {requestedType === 'corporate' && (
                  <>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Can create and manage organizations</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Send bulk certificates with custom templates</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Invite members to organization</span>
                    </div>
                  </>
                )}
                {requestedType === 'academic' && (
                  <>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Access to verified college database</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Create academic events and certifications</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-700">
                  User Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="w-0.5 h-full bg-slate-200 my-1" />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-slate-900">Request Submitted</p>
                      <p className="text-xs text-slate-500">
                        {new Date(createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 opacity-50">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">Awaiting Review</p>
                      <p className="text-xs text-slate-400">Pending admin action</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        {status === 'pending' && (
          <>
            <Separator className="my-6" />
            <div className="flex gap-3">
              <Button
                onClick={onApprove}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve Request
              </Button>
              <Button
                onClick={onDeny}
                variant="destructive"
                className="flex-1"
                size="lg"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Deny Request
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
