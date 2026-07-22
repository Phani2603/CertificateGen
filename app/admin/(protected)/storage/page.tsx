"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  HardDrive,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  CloudOff,
  Cloud,
  Database,
  FileImage,
  Loader2,
  Info,
} from "lucide-react"
import Link from "next/link"

interface S3Health {
  connected: boolean
  error: string | null
  region: string
  bucket: string
  prefix: string
  hasAccessKey: boolean
  hasSecretKey: boolean
}

interface TemplateEntry {
  s3Key: string
  eventNames: string[]
  eventIds: string[]
  source: "event" | "certificate" | "both"
  status: "available" | "missing" | "unchecked"
  affectedCertificates: number
}

interface S3Summary {
  totalUniqueKeys: number
  available: number
  missing: number
  unchecked: number
}

export default function StoragePage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [health, setHealth] = useState<S3Health | null>(null)
  const [templates, setTemplates] = useState<TemplateEntry[]>([])
  const [summary, setSummary] = useState<S3Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Upload state per s3Key
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<Record<string, { success: boolean; message: string }>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Filter state
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "missing">("all")

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/s3")
      const data = await res.json()

      if (!data.success) {
        setError(data.error || "Failed to fetch S3 data")
        return
      }

      setHealth(data.health)
      setTemplates(data.templates)
      setSummary(data.summary)
    } catch (err) {
      setError("Failed to connect to the server")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleReupload = async (template: TemplateEntry, file: File) => {
    if (!template.eventIds.length) return

    setUploadingKey(template.s3Key)
    setUploadResult((prev) => {
      const next = { ...prev }
      delete next[template.s3Key]
      return next
    })

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("oldS3Key", template.s3Key)
      formData.append("eventId", template.eventIds[0])

      const res = await fetch("/api/admin/s3/reupload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      setUploadResult((prev) => ({
        ...prev,
        [template.s3Key]: {
          success: data.success,
          message: data.message || data.error || "Unknown result",
        },
      }))

      if (data.success) {
        // Refresh the data to update statuses
        setTimeout(() => fetchData(true), 1000)
      }
    } catch {
      setUploadResult((prev) => ({
        ...prev,
        [template.s3Key]: { success: false, message: "Upload failed. Check your connection." },
      }))
    } finally {
      setUploadingKey(null)
    }
  }

  const filteredTemplates = templates.filter((t) => {
    if (statusFilter === "all") return true
    return t.status === statusFilter
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

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
            S3 Storage Management
          </h1>
          <p className="text-gray-500">
            Monitor S3 health, view template inventory, and recover missing templates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <HardDrive className="w-10 h-10 text-[#00D492]" />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Health & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* S3 Connection Status */}
        <Card className="border-none shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              {health?.connected ? (
                <Cloud className="w-4 h-4 text-green-500" />
              ) : (
                <CloudOff className="w-4 h-4 text-red-500" />
              )}
              S3 Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  health?.connected ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="text-lg font-semibold text-gray-900">
                {health?.connected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Region</span>
                <span className="font-mono text-gray-700">{health?.region || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Bucket</span>
                <span className="font-mono text-gray-700 truncate max-w-[140px]">
                  {health?.bucket || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Prefix</span>
                <span className="font-mono text-gray-700">{health?.prefix || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Access Key</span>
                <Badge variant={health?.hasAccessKey ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
                  {health?.hasAccessKey ? "Set" : "Missing"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Secret Key</span>
                <Badge variant={health?.hasSecretKey ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
                  {health?.hasSecretKey ? "Set" : "Missing"}
                </Badge>
              </div>
            </div>
            {health?.error && (
              <div className="mt-3 rounded bg-red-50 border border-red-100 px-2 py-1.5 text-[11px] text-red-700">
                {health.error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template Summary */}
        <Card className="border-none shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              Template Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-3">
              {summary?.totalUniqueKeys ?? 0}
              <span className="text-sm font-normal text-gray-500 ml-1">unique templates</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  Available in S3
                </div>
                <span className="text-sm font-semibold text-green-700">{summary?.available ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                  Missing from S3
                </div>
                <span className="text-sm font-semibold text-red-700">{summary?.missing ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                  Unchecked
                </div>
                <span className="text-sm font-semibold text-yellow-700">{summary?.unchecked ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Info */}
        <Card className="border-none shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" />
              Recovery Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-600 space-y-2">
            <p>
              Templates marked <span className="text-red-600 font-semibold">Missing</span> are referenced in the database but not found in the current S3 bucket.
            </p>
            <p>
              To recover, use the <strong>Re-upload</strong> button next to each missing template to upload the original image file. This will:
            </p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Upload the image to the new S3 bucket</li>
              <li>Update all Events referencing the old key</li>
              <li>Update all Certificates referencing the old key</li>
            </ul>
            <p className="text-gray-400 italic">
              Certificates will render correctly once their template is restored.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Template Table */}
      <Card className="border-none shadow-sm ring-1 ring-black/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileImage className="w-5 h-5 text-gray-400" />
              Template Details
            </CardTitle>
            <div className="flex items-center gap-1.5">
              {(["all", "missing", "available"] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={statusFilter === filter ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7 px-2.5"
                  onClick={() => setStatusFilter(filter)}
                >
                  {filter === "all" ? "All" : filter === "missing" ? "❌ Missing" : "✅ Available"}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {statusFilter !== "all"
                ? `No ${statusFilter} templates found.`
                : "No templates found in the database."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="text-xs font-semibold text-gray-500 w-[200px]">Event(s)</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500">S3 Key</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 w-[80px] text-center">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 w-[60px] text-center">Certs</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 w-[70px] text-center">Source</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 w-[180px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.s3Key} className="group">
                      <TableCell className="py-3">
                        <div className="space-y-0.5">
                          {template.eventNames.map((name, i) => (
                            <div key={i} className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                              {name}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <code className="text-[11px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded block truncate max-w-[320px] cursor-help">
                              {template.s3Key}
                            </code>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-md">
                            <code className="text-xs break-all">{template.s3Key}</code>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        {template.status === "available" && (
                          <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1.5 py-0 gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            OK
                          </Badge>
                        )}
                        {template.status === "missing" && (
                          <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] px-1.5 py-0 gap-1">
                            <XCircle className="w-3 h-3" />
                            Missing
                          </Badge>
                        )}
                        {template.status === "unchecked" && (
                          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px] px-1.5 py-0 gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            N/A
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <span className="text-sm font-medium text-gray-700">
                          {template.affectedCertificates}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                          {template.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        {template.status === "missing" && (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={(el) => { fileInputRefs.current[template.s3Key] = el }}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleReupload(template, file)
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1.5 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                              disabled={uploadingKey === template.s3Key}
                              onClick={() => fileInputRefs.current[template.s3Key]?.click()}
                            >
                              {uploadingKey === template.s3Key ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3 h-3" />
                                  Re-upload
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                        {template.status === "available" && (
                          <span className="text-xs text-gray-400">No action needed</span>
                        )}
                        {template.status === "unchecked" && (
                          <span className="text-xs text-gray-400">S3 offline</span>
                        )}

                        {/* Upload result feedback */}
                        {uploadResult[template.s3Key] && (
                          <div
                            className={`mt-1.5 text-[11px] rounded px-2 py-1 ${
                              uploadResult[template.s3Key].success
                                ? "bg-green-50 text-green-700 border border-green-100"
                                : "bg-red-50 text-red-700 border border-red-100"
                            }`}
                          >
                            {uploadResult[template.s3Key].message}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
