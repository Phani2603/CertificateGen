"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, TrendingUp, Infinity, Award } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface QuotaDisplayProps {
  organizationSlug: string
  showAlerts?: boolean
}

interface QuotaData {
  quota: number
  used: number
  available: number
  unlimited: boolean
  percentage: number | null
  orgName: string
  orgSlug: string
}

export function QuotaDisplay({ organizationSlug, showAlerts = true }: QuotaDisplayProps) {
  const [quotaData, setQuotaData] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const response = await fetch(`/api/quota/org/${organizationSlug}`)
        const result = await response.json()

        if (result.success) {
          setQuotaData(result.data)
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError('Failed to load quota information')
        console.error('[QuotaDisplay] Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchQuota()
    // Refresh every 30 seconds
    const interval = setInterval(fetchQuota, 30000)
    return () => clearInterval(interval)
  }, [organizationSlug])

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5 h-full flex items-center justify-center">
        <div className="animate-pulse space-y-3 w-full max-w-sm">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !quotaData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5 h-full flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 font-medium">{error || "Failed to load quota"}</p>
      </div>
    )
  }

  const { quota, used, available, unlimited, percentage } = quotaData
  const isLow = !unlimited && percentage !== null && percentage >= 80
  const isCritical = !unlimited && percentage !== null && percentage >= 95

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="bg-white border border-gray-200 rounded-lg p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-semibold text-gray-800">Certificate Quota</h3>
              <p className="text-[32px] sm:text-[36px] font-medium text-gray-900 mt-2 tracking-tight leading-none">
                {unlimited ? 'Unlimited' : 'Monthly'}
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-end shrink-0">
              {unlimited ? (
                <Infinity className="w-8 h-8 text-gray-800" />
              ) : (
                <Award className="w-8 h-8 text-gray-800" />
              )}
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {unlimited ? (
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 px-3 py-1 font-medium">
                  Unlimited Plan
                </Badge>
                <span className="text-sm text-gray-500 font-medium">
                  {used.toLocaleString()} generated so far
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-medium text-gray-900 tracking-tight">
                      {available.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 font-medium ml-2">/ {quota.toLocaleString()} remaining</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`px-2.5 py-0.5 text-xs font-medium ${
                      isCritical 
                        ? "bg-red-50 text-red-700 border-red-200" 
                        : isLow 
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {percentage?.toFixed(0)}% Used
                  </Badge>
                </div>
                <Progress 
                  value={percentage || 0} 
                  className="h-2 rounded-full bg-gray-100"
                />
                <div className="flex items-center justify-between text-sm text-gray-500 font-medium">
                  <span>{used.toLocaleString()} used</span>
                  <span className="flex items-center gap-1.5 text-gray-700">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    This period
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Quota Alerts */}
      {showAlerts && !unlimited && (
        <>
          {quota === 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800">
                <strong>No Quota Allocated:</strong> Your organization does not have any certificate quota assigned yet. Contact your administrator to request quota allocation.
              </AlertDescription>
            </Alert>
          )}
          {quota > 0 && isCritical && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-800">
                <strong>Critical:</strong> Only {available} certificates remaining. Contact your administrator to increase quota.
              </AlertDescription>
            </Alert>
          )}
          {quota > 0 && isLow && !isCritical && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm text-orange-800">
                <strong>Warning:</strong> {available} certificates remaining ({percentage?.toFixed(0)}% used). Plan ahead to avoid disruption.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  )
}

