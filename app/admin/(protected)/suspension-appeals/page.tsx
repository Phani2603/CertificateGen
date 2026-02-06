"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Clock, CheckCircle2, User, Mail, Calendar, MessageSquare } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Appeal {
    _id: string
    userId: string
    userEmail: string
    userName: string
    message: string
    status: 'pending' | 'reviewed' | 'resolved'
    adminResponse?: string
    reviewedBy?: string
    reviewedAt?: Date
    createdAt: Date
    updatedAt: Date
}

export default function SuspensionAppealsPage() {
    const [appeals, setAppeals] = useState<Appeal[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('pending')
    const [respondingTo, setRespondingTo] = useState<string | null>(null)
    const [response, setResponse] = useState('')

    useEffect(() => {
        fetchAppeals()
    }, [filter])

    const fetchAppeals = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/admin/suspension-appeals?status=${filter}`)
            const data = await response.json()
            if (data.success) {
                setAppeals(data.appeals || [])
            }
        } catch (error) {
            console.error('Error fetching appeals:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUnsuspendUser = async (userId: string, appealId: string) => {
        try {
            // Unsuspend the user
            const unsuspendResponse = await fetch(`/api/admin/users/${userId}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'unsuspend' }),
            })

            if (unsuspendResponse.ok) {
                // Refresh appeals
                fetchAppeals()
                alert('User unsuspended successfully!')
            }
        } catch (error) {
            console.error('Error unsuspending user:', error)
            alert('Failed to unsuspend user')
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-600" />
            case 'reviewed':
                return <CheckCircle2 className="w-4 h-4 text-blue-600" />
            case 'resolved':
                return <CheckCircle2 className="w-4 h-4 text-green-600" />
            default:
                return <AlertTriangle className="w-4 h-4 text-gray-600" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'reviewed':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'resolved':
                return 'bg-green-100 text-green-800 border-green-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Suspension Appeals</h1>
                    <p className="text-slate-600 text-sm mt-1">Review and manage user suspension appeals</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(['all', 'pending', 'reviewed', 'resolved'] as const).map((status) => (
                    <Button
                        key={status}
                        variant={filter === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(status)}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                ))}
            </div>

            {/* Appeals List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Loading appeals...</p>
                </div>
            ) : appeals.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">No {filter !== 'all' ? filter : ''} appeals found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {appeals.map((appeal) => (
                        <Card key={appeal._id} className="border-l-4" style={{
                            borderLeftColor: appeal.status === 'pending' ? '#eab308' : appeal.status === 'resolved' ? '#22c55e' : '#3b82f6'
                        }}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-slate-500" />
                                            <span className="font-semibold">{appeal.userName}</span>
                                            <Badge className={`${getStatusColor(appeal.status)} text-xs`} variant="outline">
                                                <span className="flex items-center gap-1">
                                                    {getStatusIcon(appeal.status)}
                                                    {appeal.status}
                                                </span>
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-600">
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {appeal.userEmail}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(appeal.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* User's Message */}
                                <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare className="w-4 h-4 text-slate-600" />
                                        <span className="text-sm font-semibold text-slate-700">User's Appeal</span>
                                    </div>
                                    <p className="text-sm text-slate-700">{appeal.message}</p>
                                </div>

                                {/* Admin Response */}
                                {appeal.adminResponse && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-semibold text-blue-900">Admin Response</span>
                                        </div>
                                        <p className="text-sm text-blue-800">{appeal.adminResponse}</p>
                                        {appeal.reviewedBy && (
                                            <p className="text-xs text-blue-600 mt-2">
                                                By {appeal.reviewedBy} • {appeal.reviewedAt && formatDate(appeal.reviewedAt)}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                {appeal.status === 'pending' && (
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleUnsuspendUser(appeal.userId, appeal._id)}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Unsuspend User
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => window.location.href = `/admin/users/${appeal.userId}/details`}
                                        >
                                            <User className="w-3 h-3 mr-1" />
                                            View User Profile
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
