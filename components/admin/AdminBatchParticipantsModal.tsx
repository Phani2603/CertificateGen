"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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
  Info,
} from "lucide-react"
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

interface AdminBatchParticipantsModalProps {
  isOpen: boolean
  onClose: () => void
  orgId: string
  historyId: string | null
  batchName?: string
  batchId?: string
}

export function AdminBatchParticipantsModal({
  isOpen,
  onClose,
  orgId,
  historyId,
  batchName,
  batchId: initialBatchId,
}: AdminBatchParticipantsModalProps) {
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
    if (isOpen && historyId) {
      fetchParticipants(pagination.currentPage)
    }
  }, [isOpen, historyId, pagination.currentPage, debouncedSearch, statusFilter])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast({
      title: "Copied!",
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

    const baseHeaders = ["Row #", "Recipient Name", "Recipient Email"]
    const dynamicHeaders = csvHeaders
    const trailingHeaders = ["Verification ID", "Issued At", "Email Status", "Email Error"]

    const allHeaders = [...baseHeaders, ...dynamicHeaders, ...trailingHeaders]

    const csvRows = participants.map((p, idx) => {
      const rowIdx = (pagination.currentPage - 1) * pagination.itemsPerPage + idx + 1
      const baseValues = [
        rowIdx,
        `"${(p.recipientName || "").replace(/"/g, '""')}"`,
        `"${(p.recipientEmail || "").replace(/"/g, '""')}"`,
      ]

      const dynamicValues = dynamicHeaders.map((header) => {
        const val = p.resolvedFieldValues?.[header]
        return `"${(val !== undefined && val !== null ? String(val) : "").replace(/"/g, '""')}"`
      })

      const trailingValues = [
        `"${p.verificationId || ""}"`,
        `"${p.issuedAt ? new Date(p.issuedAt).toLocaleString() : ""}"`,
        `"${p.emailStatus || "none"}"`,
        `"${(p.emailError || "").replace(/"/g, '""')}"`,
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[96vw] xl:max-w-7xl w-full h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 pb-4 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <DialogTitle className="text-xl font-bold tracking-tight">
                  Participant Data & CSV Audit
                </DialogTitle>
              </div>
              <DialogDescription className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                <span>Event: <strong className="text-foreground">{batchName || "Generation Batch"}</strong></span>
                {initialBatchId && (
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded border">
                    Batch: {initialBatchId}
                  </span>
                )}
              </DialogDescription>
            </div>

            {/* Quick Status Badges */}
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

          {/* Diagnostic Alert if failures exist */}
          {stats.failed > 0 && (
            <div className="mt-3 flex items-center justify-between gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>
                  <strong>Diagnostic Alert:</strong> {stats.failed} participant email
                  {stats.failed > 1 ? "s" : ""} failed delivery. Click on the <strong>Failed</strong>{" "}
                  filter to inspect error messages (e.g. SMTP rejection or bad recipient address).
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter("failed")}
                className="h-7 text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-100"
              >
                View Failed ({stats.failed})
              </Button>
            </div>
          )}
        </DialogHeader>

        {/* Toolbar */}
        <div className="p-4 border-b bg-background flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or verification ID..."
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Buttons */}
            <div className="inline-flex rounded-lg border bg-muted/30 p-1 text-xs">
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
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    statusFilter === tab.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

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
        </div>

        {/* Spreadsheet Table Container */}
        <div className="flex-1 overflow-auto relative bg-background">
          <TooltipProvider>
            <Table className="border-collapse w-full">
              <TableHeader className="bg-muted/50 sticky top-0 z-20 shadow-sm border-b">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 text-center font-bold text-xs uppercase tracking-wider border-r bg-muted/60">
                    #
                  </TableHead>
                  <TableHead className="min-w-[180px] font-semibold text-xs border-r bg-muted/40">
                    Recipient Name
                  </TableHead>
                  <TableHead className="min-w-[200px] font-semibold text-xs border-r bg-muted/40">
                    Recipient Email
                  </TableHead>

                  {/* Dynamic CSV Columns */}
                  {csvHeaders.map((header) => (
                    <TableHead
                      key={header}
                      className="min-w-[150px] font-semibold text-xs border-r bg-primary/5 text-primary whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">CSV:</span>
                        <span>{header}</span>
                      </div>
                    </TableHead>
                  ))}

                  <TableHead className="min-w-[170px] font-semibold text-xs border-r bg-muted/40">
                    Verification ID
                  </TableHead>
                  <TableHead className="min-w-[140px] font-semibold text-xs border-r bg-muted/40">
                    Issued Date
                  </TableHead>
                  <TableHead className="min-w-[130px] font-semibold text-xs border-r bg-muted/40">
                    Email Status
                  </TableHead>
                  <TableHead className="w-24 text-center font-semibold text-xs bg-muted/40">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6 + csvHeaders.length}
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
                      colSpan={6 + csvHeaders.length}
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
                        <TableCell className="text-center font-mono text-xs text-muted-foreground border-r bg-muted/10 py-2.5">
                          {rowNumber}
                        </TableCell>

                        {/* Recipient Name */}
                        <TableCell className="font-medium text-sm border-r py-2.5">
                          {row.recipientName ? (
                            <span>{row.recipientName}</span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              Missing in CSV
                            </span>
                          )}
                        </TableCell>

                        {/* Recipient Email */}
                        <TableCell className="text-sm font-mono text-muted-foreground border-r py-2.5">
                          {row.recipientEmail ? (
                            <span>{row.recipientEmail}</span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              Missing Email
                            </span>
                          )}
                        </TableCell>

                        {/* Dynamic CSV Values */}
                        {csvHeaders.map((header) => {
                          const val = row.resolvedFieldValues?.[header]
                          const hasVal = val !== undefined && val !== null && String(val).trim() !== ""
                          return (
                            <TableCell
                              key={header}
                              className="text-sm border-r py-2.5 whitespace-nowrap"
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
                        <TableCell className="font-mono text-xs border-r py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[120px] font-medium" title={row.verificationId}>
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

                        {/* Issued Date */}
                        <TableCell className="text-xs text-muted-foreground border-r py-2.5 whitespace-nowrap">
                          {row.issuedAt ? new Date(row.issuedAt).toLocaleDateString() : "—"}
                        </TableCell>

                        {/* Email Status */}
                        <TableCell className="border-r py-2.5">
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

                        {/* Actions */}
                        <TableCell className="text-center py-2.5">
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
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>

        {/* Error Detail Modal / Popover */}
        {selectedError && (
          <div className="absolute inset-x-4 bottom-16 sm:inset-x-auto sm:right-6 sm:bottom-16 sm:w-96 bg-card border shadow-xl rounded-xl p-4 z-50 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-rose-600 font-semibold text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Email Error Diagnostics</span>
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
            <p className="text-xs text-muted-foreground mb-1">
              Recipient: <strong className="text-foreground">{selectedError.name}</strong>
            </p>
            <div className="p-2.5 bg-muted font-mono text-xs text-rose-700 rounded-md border break-all max-h-36 overflow-y-auto">
              {selectedError.error}
            </div>
            <div className="mt-2.5 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(selectedError.error)
                  toast({ title: "Error copied to clipboard" })
                }}
                className="h-7 text-xs"
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

        {/* Footer / Pagination */}
        <div className="p-3 sm:p-4 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Showing {participants.length > 0 ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1 : 0} to{" "}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{" "}
              <strong>{pagination.totalItems}</strong> entries
            </span>
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
      </DialogContent>
    </Dialog>
  )
}
