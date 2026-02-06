"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Send, CheckCircle2, Clock, XCircle } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface SuspensionModalProps {
    isOpen: boolean
    reason?: string
    suspendedUntil?: string
    onClose?: () => void
}

export function SuspensionModal({ isOpen, reason, suspendedUntil, onClose }: SuspensionModalProps) {
    const [message, setMessage] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [existingAppeal, setExistingAppeal] = useState<any>(null)
    const [isLoadingAppeal, setIsLoadingAppeal] = useState(true)

    // Fetch existing appeal on mount
    useEffect(() => {
        const fetchAppeal = async () => {
            try {
                const response = await fetch('/api/user/my-appeals')
                const data = await response.json()
                if (data.success && data.appeals && data.appeals.length > 0) {
                    // Get the most recent appeal
                    setExistingAppeal(data.appeals[0])
                }
            } catch (err) {
                console.error('Error fetching appeal:', err)
            } finally {
                setIsLoadingAppeal(false)
            }
        }

        if (isOpen) {
            fetchAppeal()
        }
    }, [isOpen])

    const handleSubmitAppeal = async () => {
        if (message.trim().length < 10) {
            setError("Please provide a detailed message (at least 10 characters)")
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const response = await fetch('/api/user/suspension-appeal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message.trim() }),
            })

            const data = await response.json()

            if (data.success) {
                setExistingAppeal({
                    _id: data.appeal._id,
                    message: data.appeal.message,
                    status: 'pending',
                    createdAt: data.appeal.createdAt,
                })
                setMessage("")
            } else {
                setError(data.error || 'Failed to submit appeal')
            }
        } catch (err) {
            console.error('Error submitting appeal:', err)
            setError('Failed to submit appeal. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'indefinitely'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
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
                return <XCircle className="w-4 h-4 text-gray-600" />
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="sm:max-w-md"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-red-100 rounded-full">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <DialogTitle className="text-lg">Account Suspended</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm">
                        Your account is temporarily suspended. You cannot access the dashboard.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-3">
                    {/* Suspension Details */}
                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="font-medium text-slate-700">Reason:</span>
                            <span className="text-slate-900 text-right">{reason || 'No reason provided'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-slate-700">Until:</span>
                            <span className="text-slate-900">{formatDate(suspendedUntil)}</span>
                        </div>
                    </div>

                    {/* Existing Appeal Status */}
                    {!isLoadingAppeal && existingAppeal && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-blue-900">Your Appeal Status</h4>
                                <Badge className={`${getStatusColor(existingAppeal.status)} text-xs`} variant="outline">
                                    <span className="flex items-center gap-1">
                                        {getStatusIcon(existingAppeal.status)}
                                        {existingAppeal.status}
                                    </span>
                                </Badge>
                            </div>
                            <p className="text-xs text-blue-800 mb-1">
                                <strong>Submitted:</strong> {formatDate(existingAppeal.createdAt)}
                            </p>
                            <p className="text-xs text-blue-700 italic">"{existingAppeal.message}"</p>
                            {existingAppeal.adminResponse && (
                                <div className="mt-2 pt-2 border-t border-blue-200">
                                    <p className="text-xs text-blue-900">
                                        <strong>Admin Response:</strong> {existingAppeal.adminResponse}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Appeal Form - Only show if no pending appeal */}
                    {!isLoadingAppeal && (!existingAppeal || existingAppeal.status !== 'pending') && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Lodge a Complaint</h4>
                            <p className="text-xs text-slate-600">
                                Explain why this suspension should be reviewed.
                            </p>
                            <Textarea
                                placeholder="Describe your situation..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="min-h-[80px] resize-none text-sm"
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-slate-500">Minimum 10 characters</p>

                            {error && (
                                <Alert variant="destructive" className="py-2">
                                    <AlertDescription className="text-xs">{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                onClick={handleSubmitAppeal}
                                disabled={isSubmitting || message.trim().length < 10}
                                className="w-full"
                                size="sm"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-3 h-3 mr-2" />
                                        Submit Appeal
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Pending Appeal Message */}
                    {!isLoadingAppeal && existingAppeal && existingAppeal.status === 'pending' && (
                        <Alert className="bg-yellow-50 border-yellow-200 py-2">
                            <AlertDescription className="text-xs text-yellow-800">
                                Your appeal is being reviewed. You'll be notified once the admin responds.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <div className="border-t pt-3">
                    <p className="text-xs text-slate-500 text-center">
                        Need help? Contact{' '}
                        <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
                            support@example.com
                        </a>
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
