"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, Mail, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

export type EmailStatus = "idle" | "sending" | "success" | "error"

interface EmailStatusCardProps {
  status: EmailStatus
  emailsSent: number
  totalEmails: number
  errors?: Array<{ email: string; error: string }>
  className?: string
  deliveryMode?: "link-only" | "attachment"
}

export function EmailStatusCard({
  status,
  emailsSent,
  totalEmails,
  errors = [],
  className,
  deliveryMode = "link-only",
}: EmailStatusCardProps) {
  // Force re-render on prop changes for real-time updates
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const percentage = totalEmails > 0 ? (emailsSent / totalEmails) * 100 : 0
    setProgress(percentage)
  }, [emailsSent, totalEmails])

  // Determine status icon and styles
  const getStatusConfig = () => {
    switch (status) {
      case "sending":
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          badgeText: "Sending",
          badgeClass: "bg-black text-white",
        }
      case "success":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          badgeText: "Completed",
          badgeClass: "bg-black text-white",
        }
      case "error":
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          badgeText: "Failed",
          badgeClass: "bg-red-600 text-white",
        }
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          badgeText: "Ready",
          badgeClass: "bg-black text-white",
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Card id="email-status-card" className={cn("p-6 border sticky top-6 bg-white", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-black" />
            <h3 className="font-semibold text-black">Email Status</h3>
          </div>
          <Badge className={cn("gap-1.5 border-0", config.badgeClass)}>
            {config.icon}
            {config.badgeText}
          </Badge>
        </div>

        {/* Status Content */}
        <div className="rounded-lg p-4 bg-gray-50">
          <div className="space-y-3">
            {/* Progress Stats */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-black">
                {status === "idle" ? "Awaiting send" : "Progress"}
              </span>
              <span className="text-2xl font-bold">
                <span className="text-green-600">{emailsSent}</span>
                <span className="text-black"> / {totalEmails}</span>
              </span>
            </div>

            {/* Progress Bar (only show when sending or completed) */}
            {(status === "sending" || status === "success") && totalEmails > 0 && (
              <div className="space-y-1">
                <Progress
                  value={progress}
                  className="h-2.5 bg-gray-200"
                  indicatorClassName="bg-green-600"
                />
                <p className="text-xs text-black text-right font-medium">
                  {Math.round(progress)}% complete
                </p>
              </div>
            )}

            {/* Delivery Mode Info */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-700">Delivery Mode:</span>
              <span className="font-medium text-black">
                {deliveryMode === "link-only" ? "Link Only" : "With Attachment"}
              </span>
            </div>

            {/* Batch Size Info */}
            {status === "sending" && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700">Batch Size:</span>
                <span className="font-medium text-black">
                  {deliveryMode === "link-only" ? "50" : "3"} per batch
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error Details */}
        {errors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-black text-sm mb-1">
                  {errors.length} email{errors.length > 1 ? "s" : ""} failed
                </p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-gray-700 hover:text-black">
                    View failed emails
                  </summary>
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {errors.slice(0, 10).map((err, idx) => (
                      <div key={idx} className="text-xs p-2 bg-white rounded">
                        <p className="font-medium text-black">{err.email}</p>
                        <p className="text-gray-600">{err.error}</p>
                      </div>
                    ))}
                    {errors.length > 10 && (
                      <p className="text-xs text-gray-600 italic">
                        ...and {errors.length - 10} more
                      </p>
                    )}
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {status === "success" && errors.length === 0 && (
          <div className="flex items-center gap-2 text-sm bg-green-50 border-l-4 border-green-600 p-3 rounded">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="font-medium text-black">All emails sent successfully!</span>
          </div>
        )}

        {/* Idle State Message */}
        {status === "idle" && totalEmails > 0 && (
          <p className="text-xs text-gray-600 text-center py-2">
            Ready to send {totalEmails} email{totalEmails > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </Card>
  )
}
