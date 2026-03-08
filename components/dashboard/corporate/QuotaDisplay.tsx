"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
      <Card className="border-none shadow-sm ring-1 ring-black/5">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !quotaData) {
    return null
  }

  const { quota, used, available, unlimited, percentage } = quotaData
  const isLow = !unlimited && percentage !== null && percentage >= 80
  const isCritical = !unlimited && percentage !== null && percentage >= 95

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-sm ring-1 ring-black/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">Certificate Quota</CardTitle>
              <CardDescription className="text-sm mt-1">
                {unlimited ? 'Unlimited certificate generation' : 'Monthly certificate allowance'}
              </CardDescription>
            </div>
            <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center">
              {unlimited ? (
                <Infinity className="w-5 h-5 text-teal-600" />
              ) : (
                <Award className="w-5 h-5 text-teal-600" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {unlimited ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                Unlimited Plan
              </Badge>
              <span className="text-sm text-gray-500">
                {used.toLocaleString()} generated
              </span>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-bold text-gray-900">
                      {available.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">/ {quota.toLocaleString()}</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      isCritical 
                        ? "bg-red-50 text-red-700 border-red-200" 
                        : isLow 
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : "bg-green-50 text-green-700 border-green-200"
                    }
                  >
                    {percentage?.toFixed(0)}% Used
                  </Badge>
                </div>
                <Progress 
                  value={percentage || 0} 
                  className="h-2"
                />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{used.toLocaleString()} certificates used</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    This period
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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

