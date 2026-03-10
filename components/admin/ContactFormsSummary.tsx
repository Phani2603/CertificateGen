"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Mail,
  Clock,
  CheckCircle2,
  Archive,
  AlertCircle,
  ArrowRight,
  Loader2,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface ContactForm {
  _id: string
  name: string
  email: string
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  createdAt: string
}

const statusIcons = {
  new: AlertCircle,
  read: Clock,
  replied: CheckCircle2,
  archived: Archive,
}

const statusColors = {
  new: "bg-red-50 text-red-700 border-red-200",
  read: "bg-blue-50 text-blue-700 border-blue-200",
  replied: "bg-green-50 text-green-700 border-green-200",
  archived: "bg-gray-50 text-gray-700 border-gray-200",
}

export function ContactFormsSummary() {
  const [contactForms, setContactForms] = useState<ContactForm[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContactForms = async () => {
      try {
        const response = await fetch('/api/contact')
        const data = await response.json()
        
        if (data.success) {
          setContactForms(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch contact forms:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchContactForms()
  }, [])

  const stats = {
    total: contactForms.length,
    new: contactForms.filter((f) => f.status === 'new').length,
    read: contactForms.filter((f) => f.status === 'read').length,
    replied: contactForms.filter((f) => f.status === 'replied').length,
    archived: contactForms.filter((f) => f.status === 'archived').length,
    pending: contactForms.filter((f) => f.status === 'new' || f.status === 'read').length,
  }

  const recentForms = contactForms
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Calculate response rate (replied / (replied + archived))
  const responseRate = stats.replied + stats.archived > 0
    ? Math.round((stats.replied / (stats.replied + stats.archived)) * 100)
    : 0

  if (loading) {
    return (
      <Card className="border-none shadow-sm ring-1 ring-black/5">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#00D492]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Contact Form Submissions</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage customer inquiries and support requests
          </p>
        </div>
        <Link href="/admin/contact-forms">
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="border-none shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-600">New</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.new}</p>
                <p className="text-[10px] text-red-500 mt-0.5">Needs attention</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.read}</p>
                <p className="text-[10px] text-blue-500 mt-0.5">Being reviewed</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600">Replied</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.replied}</p>
                <p className="text-[10px] text-green-500 mt-0.5">Resolved</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{responseRate}%</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {responseRate >= 80 ? (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-orange-600" />
                  )}
                  <span className={cn("text-[10px]", responseRate >= 80 ? "text-green-600" : "text-orange-600")}>
                    {responseRate >= 80 ? "Excellent" : "Needs improvement"}
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#00D492]/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#00D492]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      {recentForms.length > 0 && (
        <Card className="border-none shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900">Recent Submissions</CardTitle>
            <CardDescription className="text-xs">Latest contact form entries</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentForms.map((form) => {
                const Icon = statusIcons[form.status]
                return (
                  <Link
                    key={form._id}
                    href="/admin/contact-forms"
                    className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="shrink-0">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", statusColors[form.status].replace('text-', 'text-').replace('border-', 'bg-'))}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{form.name}</p>
                      <p className="text-xs text-gray-500 truncate">{form.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn("text-xs", statusColors[form.status])}>
                        {form.status}
                      </Badge>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(form.createdAt), 'MMM dd')}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert for Pending Items */}
      {stats.pending > 0 && (
        <Card className="border-none shadow-sm ring-1 ring-orange-500/20 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900">
                  {stats.pending} {stats.pending === 1 ? 'submission' : 'submissions'} pending response
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  {stats.new > 0 && `${stats.new} new`}
                  {stats.new > 0 && stats.read > 0 && ' and '}
                  {stats.read > 0 && `${stats.read} in progress`}
                </p>
              </div>
              <Link href="/admin/contact-forms">
                <Button size="sm" className="h-8 bg-orange-600 hover:bg-orange-700 text-white">
                  Review Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {contactForms.length === 0 && (
        <Card className="border-none shadow-sm ring-1 ring-black/5">
          <CardContent className="p-8 text-center">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No contact form submissions yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
