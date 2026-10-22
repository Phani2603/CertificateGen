"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  Download,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ChevronDown,
  Building2,
  FolderGit2,
  SlidersHorizontal,
  Columns3,
  Eye,
  EyeOff,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ParticipantRow {
  id: string
  recipientName: string
  recipientEmail: string
  verificationId: string
  issuedAt: string | null
  batchId: string | null
  templateS3Key: string | null
  resolvedFieldValues: Record<string, any>
  emailStatus: "sent" | "pending" | "failed" | "none" | string
  emailError: string | null
  isValid: boolean
}

interface BatchStats {
  sent: number
  pending: number
  failed: number
  none: number
  total: number
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface BatchOption {
  _id: string
  eventName: string
  batchId?: string
  certificateCount?: number
}

interface AdminBatchParticipantsViewProps {
  orgId: string
  orgName: string
  historyId: string
  batchName?: string
  batchId?: string
  allBatches?: BatchOption[]
  onBack: () => void
  onSwitchBatch?: (historyId: string, eventName: string, batchId?: string) => void
}

export function AdminBatchParticipantsView({
  orgId,
  orgName,
  historyId,
  batchName,
  batchId: initialBatchId,
  allBatches = [],
  onBack,
  onSwitchBatch,
}: AdminBatchParticipantsViewProps) {
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [participants, setParticipants] = useState<ParticipantRow[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [stats, setStats] = useState<BatchStats>({ sent: 0, pending: 0, failed: 0, none: 0, total: 0 })
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50,
    hasNextPage: false,
    hasPrevPage: false,
  })

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedError, setSelectedError] = useState<{ name: string; error: string } | null>(null)

  // Column visibility state (key -> boolean)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    name: true,
    email: true,
    verificationId: true,
    issuedAt: true,
    emailStatus: true,
    actions: true,
  })

  // Sync CSV headers into visible columns map
  useEffect(() => {
    if (csvHeaders.length > 0) {
      setVisibleColumns((prev) => {
        const next = { ...prev }
        csvHeaders.forEach((header) => {
          if (next[header] === undefined) {
            next[header] = true
          }
        })
        return next
      })
    }
  }, [csvHeaders])

  const toggleColumn = (colKey: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [colKey]: !prev[colKey],
    }))
  }

  const showAllColumns = () => {
    const updated: Record<string, boolean> = {
      name: true,
      email: true,
      verificationId: true,
      issuedAt: true,
      emailStatus: true,
      actions: true,
    }
    csvHeaders.forEach((h) => {
      updated[h] = true
    })
    setVisibleColumns(updated)
  }

  const hideAllCsvColumns = () => {
    setVisibleColumns((prev) => {
      const updated = { ...prev }
      csvHeaders.forEach((h) => {
        updated[h] = false
      })
      return updated
    })
  }

  const resetColumns = () => {
    const def: Record<string, boolean> = {
      name: true,
      email: true,
      verificationId: true,
      issuedAt: true,
      emailStatus: true,
      actions: true,
    }
    csvHeaders.forEach((h) => {
      def[h] = true
    })
    setVisibleColumns(def)
  }

  // Calculate active visible columns count
  const activeVisibleColumnCount =
    1 + // Row #
    (visibleColumns.name !== false ? 1 : 0) +
    (visibleColumns.email !== false ? 1 : 0) +
    csvHeaders.filter((h) => visibleColumns[h] !== false).length +
    (visibleColumns.verificationId !== false ? 1 : 0) +
    (visibleColumns.issuedAt !== false ? 1 : 0) +
    (visibleColumns.emailStatus !== false ? 1 : 0) +
    (visibleColumns.actions !== false ? 1 : 0)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPagination((prev) => ({ ...prev, currentPage: 1 }))
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchParticipants = useCallback(
    async (page = 1) => {
      if (!orgId || !historyId) return
      setLoading(true)

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pagination.itemsPerPage),
        })

        if (debouncedSearch) {
          params.set("q", debouncedSearch)
        }
        if (statusFilter && statusFilter !== "all") {
          params.set("status", statusFilter)
        }

        const res = await fetch(
          `/api/admin/organizations/${orgId}/history/${historyId}/participants?${params.toString()}`
        )
        const data = await res.json()

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load participants")
        }

        setParticipants(data.participants || [])
        setCsvHeaders(data.csvHeaders || [])
        if (data.emailStatusCounts) {
          setStats(data.emailStatusCounts)
        }
        if (data.pagination) {
          setPagination(data.pagination)
        }
      } catch (err: any) {
        console.error("Error loading participants:", err)
        toast({
          title: "Error loading batch data",
          description: err.message || "Failed to fetch participants for this batch.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [orgId, historyId, debouncedSearch, statusFilter, pagination.itemsPerPage, toast]
  )

  useEffect(() => {
    fetchParticipants(pagination.currentPage)
  }, [historyId, pagination.currentPage, debouncedSearch, statusFilter])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast({
      title: "Copied to clipboard",
      description: text,
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  const exportSpreadsheetToCSV = () => {
    if (participants.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no participants to export for this view.",
      })
      return
    }

    const baseHeaders = [
      "Row #",
      ...(visibleColumns.name !== false ? ["Recipient Name"] : []),
      ...(visibleColumns.email !== false ? ["Recipient Email"] : []),
    ]
    const dynamicHeaders = csvHeaders.filter((h) => visibleColumns[h] !== false)
    const trailingHeaders = [
      ...(visibleColumns.verificationId !== false ? ["Verification ID"] : []),
      ...(visibleColumns.issuedAt !== false ? ["Issued At"] : []),
      ...(visibleColumns.emailStatus !== false ? ["Email Status", "Email Error"] : []),
    ]

    const allHeaders = [...baseHeaders, ...dynamicHeaders, ...trailingHeaders]

    const csvRows = participants.map((p, idx) => {
      const rowIdx = (pagination.currentPage - 1) * pagination.itemsPerPage + idx + 1
      const baseValues = [
        rowIdx,
        ...(visibleColumns.name !== false ? [`"${(p.recipientName || "").replace(/"/g, '""')}"`] : []),
        ...(visibleColumns.email !== false ? [`"${(p.recipientEmail || "").replace(/"/g, '""')}"`] : []),
      ]

      const dynamicValues = dynamicHeaders.map((header) => {
        const val = p.resolvedFieldValues?.[header]
        return `"${(val !== undefined && val !== null ? String(val) : "").replace(/"/g, '""')}"`
      })

      const trailingValues = [
        ...(visibleColumns.verificationId !== false ? [`"${p.verificationId || ""}"`] : []),
        ...(visibleColumns.issuedAt !== false ? [`"${p.issuedAt ? new Date(p.issuedAt).toLocaleString() : ""}"`] : []),
        ...(visibleColumns.emailStatus !== false
          ? [`"${p.emailStatus || "none"}"`, `"${(p.emailError || "").replace(/"/g, '""')}"`]
          : []),
      ]

      return [...baseValues, ...dynamicValues, ...trailingValues].join(",")
    })

    const csvString = [allHeaders.join(","), ...csvRows].join("\n")
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute(
      "download",
      `participants_audit_${batchName || "batch"}_${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Tree / Breadcrumb Navigation */}
      <div className="flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList className="text-xs sm:text-sm">
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/organizations" className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                Organizations
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <button
                onClick={onBack}
                className="hover:text-foreground text-muted-foreground transition-colors font-medium"
              >
                {orgName}
              </button>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <button
                onClick={onBack}
                className="hover:text-foreground text-muted-foreground transition-colors font-medium"
              >
                Certificate History
              </button>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-foreground flex items-center gap-1.5">
                <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                <span>{batchName || "Batch Inspection"}</span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Action Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div className="flex items-start sm:items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="h-9 px-3 gap-1.5 text-xs shrink-0 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Overview</span>
            </Button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {batchName || "Batch Participants"}
                </h1>

                {/* Batch Tree Switcher */}
                {allBatches.length > 1 && onSwitchBatch && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1">
                        <FolderGit2 className="h-3.5 w-3.5" />
                        <span>Switch Batch</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-y-auto">
                      {allBatches.map((b) => (
                        <DropdownMenuItem
                          key={b._id}
                          onClick={() => onSwitchBatch(b._id, b.eventName, b.batchId)}
                          className={`text-xs flex items-center justify-between cursor-pointer ${
                            b._id === historyId ? "bg-muted font-bold" : ""
                          }`}
                        >
                          <span className="truncate">{b.eventName}</span>
                          <span className="text-[11px] text-muted-foreground ml-2">
                            {b.certificateCount} certs
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-2 mt-0.5">
                <span>Inspection & CSV Data Health view</span>
                {initialBatchId && (
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded border">
                    Batch: {initialBatchId}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-background text-xs py-1 px-2.5">
              Total: <span className="font-bold ml-1">{stats.total}</span>
            </Badge>
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs py-1 px-2.5"
            >
              <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
              Sent: <span className="font-bold ml-1">{stats.sent}</span>
            </Badge>
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-700 border-amber-200 text-xs py-1 px-2.5"
            >
              <Clock className="h-3 w-3 mr-1 text-amber-600" />
              Pending: <span className="font-bold ml-1">{stats.pending}</span>
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs py-1 px-2.5 ${
                stats.failed > 0
                  ? "bg-rose-50 text-rose-700 border-rose-200 font-semibold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <XCircle className="h-3 w-3 mr-1 text-rose-600" />
              Failed: <span className="font-bold ml-1">{stats.failed}</span>
            </Badge>
            {stats.none > 0 && (
              <Badge variant="outline" className="bg-muted text-muted-foreground text-xs py-1 px-2.5">
                Not Queued: <span className="font-bold ml-1">{stats.none}</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Diagnostic Banner if failed emails exist */}
        {stats.failed > 0 && (
          <div className="flex items-center justify-between gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>
                <strong>CSV & Email Diagnostics:</strong> {stats.failed} participant email
                {stats.failed > 1 ? "s" : ""} failed. Use the <strong>Failed</strong> filter to inspect the exact server errors (e.g. invalid recipient address, SMTP timeout, missing name).
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter("failed")}
              className="h-7 text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-100 shrink-0"
            >
              Show Failed ({stats.failed})
            </Button>
          </div>
        )}
      </div>

      {/* Main Spreadsheet Card */}
      <Card className="shadow-sm border">
        {/* Toolbar */}
        <CardHeader className="p-4 border-b bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or verification ID..."
              className="pl-9 h-9 text-sm bg-background"
            />
          </div>

          {/* Filter Pills & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border bg-muted/40 p-1 text-xs">
              {[
                { key: "all", label: "All" },
                { key: "sent", label: "Sent" },
                { key: "pending", label: "Pending" },
                { key: "failed", label: "Failed" },
                { key: "none", label: "Not Sent" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setStatusFilter(tab.key)
                    setPagination((prev) => ({ ...prev, currentPage: 1 }))
                  }}
                  className={`px-3 py-1 rounded-md transition-all font-medium ${
                    statusFilter === tab.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Columns Visibility Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-3 text-xs gap-1.5 bg-background shadow-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Columns</span>
                  <span className="px-1.5 py-0.2 bg-muted text-[10px] font-mono rounded font-semibold">
                    {activeVisibleColumnCount - 1}/{csvHeaders.length + 6}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto p-1.5">
                <div className="flex items-center justify-between px-2 py-1.5 border-b mb-1">
                  <span className="font-semibold text-xs">Visible Columns</span>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      onClick={showAllColumns}
                      className="text-primary hover:underline font-medium"
                    >
                      All
                    </button>
                    <span className="text-muted-foreground/40">|</span>
                    <button
                      onClick={hideAllCsvColumns}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Hide CSV
                    </button>
                    <span className="text-muted-foreground/40">|</span>
                    <button
                      onClick={resetColumns}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider py-1 px-2">
                  Standard Columns
                </DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.name !== false}
                  onCheckedChange={() => toggleColumn("name")}
                  className="text-xs py-1"
                >
                  Recipient Name
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.email !== false}
                  onCheckedChange={() => toggleColumn("email")}
                  className="text-xs py-1"
                >
                  Recipient Email
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.verificationId !== false}
                  onCheckedChange={() => toggleColumn("verificationId")}
                  className="text-xs py-1"
                >
                  Verification ID
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.issuedAt !== false}
                  onCheckedChange={() => toggleColumn("issuedAt")}
                  className="text-xs py-1"
                >
                  Issued Date
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.emailStatus !== false}
                  onCheckedChange={() => toggleColumn("emailStatus")}
                  className="text-xs py-1"
                >
                  Email Status
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.actions !== false}
                  onCheckedChange={() => toggleColumn("actions")}
                  className="text-xs py-1"
                >
                  Actions (Verify)
                </DropdownMenuCheckboxItem>

                {csvHeaders.length > 0 && (
                  <>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuLabel className="text-[10px] uppercase font-bold text-primary tracking-wider py-1 px-2 flex items-center justify-between">
                      <span>CSV Dynamic Fields ({csvHeaders.length})</span>
                    </DropdownMenuLabel>
                    <div className="space-y-0.5">
                      {csvHeaders.map((header) => (
                        <DropdownMenuCheckboxItem
                          key={header}
                          checked={visibleColumns[header] !== false}
                          onCheckedChange={() => toggleColumn(header)}
                          className="text-xs py-1"
                        >
                          <span className="truncate">{header}</span>
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchParticipants(pagination.currentPage)}
              disabled={loading}
              className="h-9 px-3 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={exportSpreadsheetToCSV}
              disabled={participants.length === 0}
              className="h-9 px-3 text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>

        {/* Native In-Page Spreadsheet Table Container with Vertical & Horizontal Scrollbars */}
        <CardContent className="p-0">
          <div className="overflow-auto relative w-full max-h-[620px] border-b bg-background shadow-inner [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 [&::-webkit-scrollbar-track]:bg-muted/10">
            <TooltipProvider>
              <Table className="border-collapse w-full">
                <TableHeader className="bg-muted/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm border-b">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center font-bold text-xs uppercase tracking-wider border-r bg-muted/60">
                      #
                    </TableHead>
                    {visibleColumns.name !== false && (
                      <TableHead className="min-w-[180px] font-semibold text-xs border-r bg-muted/40">
                        Recipient Name
                      </TableHead>
                    )}
                    {visibleColumns.email !== false && (
                      <TableHead className="min-w-[200px] font-semibold text-xs border-r bg-muted/40">
                        Recipient Email
                      </TableHead>
                    )}

                    {/* Dynamic CSV Columns */}
                    {csvHeaders.map((header) => {
                      if (visibleColumns[header] === false) return null
                      return (
                        <TableHead
                          key={header}
                          className="min-w-[150px] font-semibold text-xs border-r bg-primary/5 text-primary whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">CSV:</span>
                            <span>{header}</span>
                          </div>
                        </TableHead>
                      )
                    })}

                    {visibleColumns.verificationId !== false && (
                      <TableHead className="min-w-[170px] font-semibold text-xs border-r bg-muted/40">
                        Verification ID
                      </TableHead>
                    )}
                    {visibleColumns.issuedAt !== false && (
                      <TableHead className="min-w-[140px] font-semibold text-xs border-r bg-muted/40">
                        Issued Date
                      </TableHead>
                    )}
                    {visibleColumns.emailStatus !== false && (
                      <TableHead className="min-w-[130px] font-semibold text-xs border-r bg-muted/40">
                        Email Status
                      </TableHead>
                    )}
                    {visibleColumns.actions !== false && (
                      <TableHead className="w-24 text-center font-semibold text-xs bg-muted/40">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={activeVisibleColumnCount}
                        className="h-64 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                          <span className="text-sm">Loading participant spreadsheet...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : participants.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={activeVisibleColumnCount}
                        className="h-64 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileSpreadsheet className="h-8 w-8 text-muted-foreground/50" />
                          <span className="text-sm font-medium">No participants found</span>
                          <span className="text-xs text-muted-foreground">
                            {debouncedSearch || statusFilter !== "all"
                              ? "Try adjusting your search query or status filter."
                              : "No certificates recorded in this batch."}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    participants.map((row, idx) => {
                      const rowNumber =
                        (pagination.currentPage - 1) * pagination.itemsPerPage + idx + 1

                      return (
                        <TableRow
                          key={row.id}
                          className={`hover:bg-muted/40 transition-colors ${
                            row.emailStatus === "failed" ? "bg-rose-50/30" : ""
                          }`}
                        >
                          {/* Row # */}
                          <TableCell className="text-center font-mono text-xs text-muted-foreground border-r bg-muted/10 py-3">
                            {rowNumber}
                          </TableCell>

                          {/* Recipient Name */}
                          {visibleColumns.name !== false && (
                            <TableCell className="font-medium text-sm border-r py-3">
                              {row.recipientName ? (
                                <span>{row.recipientName}</span>
                              ) : (
                                <span className="inline-flex items-center text-xs text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                  Missing in CSV
                                </span>
                              )}
                            </TableCell>
                          )}

                          {/* Recipient Email */}
                          {visibleColumns.email !== false && (
                            <TableCell className="text-sm font-mono text-muted-foreground border-r py-3">
                              {row.recipientEmail ? (
                                <span>{row.recipientEmail}</span>
                              ) : (
                                <span className="inline-flex items-center text-xs text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                  Missing Email
                                </span>
                              )}
                            </TableCell>
                          )}

                          {/* Dynamic CSV Values */}
                          {csvHeaders.map((header) => {
                            if (visibleColumns[header] === false) return null
                            const val = row.resolvedFieldValues?.[header]
                            const hasVal = val !== undefined && val !== null && String(val).trim() !== ""
                            return (
                              <TableCell
                                key={header}
                                className="text-sm border-r py-3 whitespace-nowrap"
                              >
                                {hasVal ? (
                                  <span className="text-foreground">{String(val)}</span>
                                ) : (
                                  <span className="inline-flex items-center text-[11px] text-amber-600 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/70">
                                    Empty
                                  </span>
                                )}
                              </TableCell>
                            )
                          })}

                          {/* Verification ID */}
                          {visibleColumns.verificationId !== false && (
                            <TableCell className="font-mono text-xs border-r py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate max-w-[130px] font-medium" title={row.verificationId}>
                                  {row.verificationId}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopy(row.verificationId, row.id)}
                                  className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                                  title="Copy Verification ID"
                                >
                                  {copiedId === row.id ? (
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          )}

                          {/* Issued Date */}
                          {visibleColumns.issuedAt !== false && (
                            <TableCell className="text-xs text-muted-foreground border-r py-3 whitespace-nowrap">
                              {row.issuedAt ? new Date(row.issuedAt).toLocaleDateString() : "—"}
                            </TableCell>
                          )}

                          {/* Email Status */}
                          {visibleColumns.emailStatus !== false && (
                            <TableCell className="border-r py-3">
                              {row.emailStatus === "sent" && (
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs py-0.5 font-medium"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                                  Sent
                                </Badge>
                              )}
                              {row.emailStatus === "pending" && (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 text-amber-700 border-amber-200 text-xs py-0.5 font-medium"
                                >
                                  <Clock className="h-3 w-3 mr-1 text-amber-600" />
                                  Pending
                                </Badge>
                              )}
                              {row.emailStatus === "failed" && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant="outline"
                                      onClick={() =>
                                        setSelectedError({
                                          name: row.recipientName || row.recipientEmail,
                                          error: row.emailError || "Unknown email delivery failure",
                                        })
                                      }
                                      className="bg-rose-50 text-rose-700 border-rose-200 text-xs py-0.5 font-semibold cursor-pointer hover:bg-rose-100"
                                    >
                                      <AlertTriangle className="h-3 w-3 mr-1 text-rose-600" />
                                      Failed (View)
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs text-xs bg-popover text-popover-foreground p-2 shadow-md">
                                    <p className="font-semibold text-rose-600 mb-1">Email Error:</p>
                                    <p className="line-clamp-3">{row.emailError || "Unknown error"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {(row.emailStatus === "none" || !row.emailStatus) && (
                                <Badge
                                  variant="outline"
                                  className="bg-muted text-muted-foreground text-xs py-0.5"
                                >
                                  Not Queued
                                </Badge>
                              )}
                            </TableCell>
                          )}

                          {/* Actions */}
                          {visibleColumns.actions !== false && (
                            <TableCell className="text-center py-3">
                              {row.verificationId ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="h-7 px-2 text-xs text-primary hover:text-primary/80"
                                >
                                  <a
                                    href={`/verify/${row.verificationId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Open Certificate Verification"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                    Verify
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>

          {/* Error Detail Inspector Drawer/Card */}
          {selectedError && (
            <div className="m-4 p-4 bg-rose-50/70 border border-rose-200 rounded-xl animate-in fade-in">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-rose-700 font-semibold text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Email Delivery Error Trace</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedError(null)}
                  className="h-6 w-6 p-0 text-muted-foreground"
                >
                  ✕
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-1.5">
                Recipient: <strong className="text-foreground">{selectedError.name}</strong>
              </p>
              <div className="p-3 bg-background font-mono text-xs text-rose-700 rounded-lg border break-all max-h-40 overflow-y-auto">
                {selectedError.error}
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedError.error)
                    toast({ title: "Error trace copied" })
                  }}
                  className="h-7 text-xs bg-background"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Error
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedError(null)}
                  className="h-7 text-xs"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="p-4 border-t bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>
              Showing {participants.length > 0 ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1 : 0} to{" "}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{" "}
              <strong>{pagination.totalItems}</strong> entries
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const prev = Math.max(1, pagination.currentPage - 1)
                  setPagination((p) => ({ ...p, currentPage: prev }))
                }}
                disabled={pagination.currentPage <= 1 || loading}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>

              <span className="px-2 text-foreground font-medium">
                Page {pagination.currentPage} of {Math.max(1, pagination.totalPages)}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = pagination.currentPage + 1
                  setPagination((p) => ({ ...p, currentPage: next }))
                }}
                disabled={pagination.currentPage >= pagination.totalPages || loading}
                className="h-8 px-2.5 text-xs"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
