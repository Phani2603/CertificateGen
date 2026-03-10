"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QuotaAnalytics } from "@/components/admin/QuotaAnalytics"
import { QuotaAlertBanner } from "@/components/admin/QuotaAlertBanner"
import { Award, TrendingUp, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function QuotasPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Certificate Quota Management
          </h1>
          <p className="text-gray-500">
            Monitor and manage certificate generation limits for all organizations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Award className="w-10 h-10 text-[#00D492]" />
        </div>
      </div>

      {/* Quota Alerts */}
      <QuotaAlertBanner />

      {/* Main Quota Analytics Section with Pagination */}
      <QuotaAnalytics />

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              About Quota Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>
              The quota system allows you to control how many certificates each organization can generate.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Set Quota:</strong> Replace the total quota with a new value</li>
              <li><strong>Add Quota:</strong> Increase the quota by adding to the current total</li>
              <li><strong>Unlimited:</strong> Set quota to -1 for no restrictions</li>
              <li><strong>Reset Usage:</strong> Clear certificate usage counter to zero</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>Common quota management tasks:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                <div>
                  <strong>Initial Setup:</strong> Use "Set Quota" to allocate certificates to new organizations
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5" />
                <div>
                  <strong>Top-ups:</strong> Use "Add Quota" to give existing organizations more certificates
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5" />
                <div>
                  <strong>Monitoring:</strong> Watch for organizations with &gt;80% usage (marked "At Risk")
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
