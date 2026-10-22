"use client"

import React, { useState, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Calendar,
  Award,
  Layers,
  Image as ImageIcon,
  Eye,
  FileSpreadsheet,
  RefreshCw,
  Maximize2,
  ArrowLeft,
  ChevronDown,
  Building2,
  FolderGit2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FieldConfig {
  id?: string
  name: string
  x: number
  y: number
  fontSize: number
  fontFamily?: string
  fontWeight?: number | string
  color?: string
  alignment?: string
  align?: string
}

interface EventData {
  _id: string
  name: string
  description?: string
  date?: string
  templateS3Key?: string
  fieldConfiguration?: FieldConfig[]
  certificatesGenerated?: number
  liveCertificateCount?: number
  createdAt?: string
}

interface AdminEventDetailsViewProps {
  orgId: string
  orgName: string
  event: EventData
  allEvents?: EventData[]
  linkedBatches?: any[]
  onBack: () => void
  onSwitchEvent?: (event: EventData) => void
  onInspectBatch?: (historyId: string, eventName: string, batchId?: string) => void
}

export function AdminEventDetailsView({
  orgId,
  orgName,
  event,
  allEvents = [],
  linkedBatches = [],
  onBack,
  onSwitchEvent,
  onInspectBatch,
}: AdminEventDetailsViewProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [showOverlays, setShowOverlays] = useState(true)

  useEffect(() => {
    if (!event?.templateS3Key) {
      setSignedUrl(null)
      return
    }

    const fetchTemplateSignedUrl = async () => {
      setLoadingTemplate(true)
      setTemplateError(null)

      try {
        const res = await fetch(
          `/api/templates/signed-url?key=${encodeURIComponent(event.templateS3Key!)}`
        )
        const data = await res.json()

        if (!res.ok || !data.success || !data.signedUrl) {
          throw new Error(data.error || "Failed to generate signed URL for template")
        }

        setSignedUrl(data.signedUrl)
      } catch (err: any) {
        console.error("Error fetching template URL:", err)
        setTemplateError(err.message || "Could not load certificate template image.")
      } finally {
        setLoadingTemplate(false)
      }
    }

    fetchTemplateSignedUrl()
  }, [event?.templateS3Key])

  const fields = event.fieldConfiguration || []

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
                Events
              </button>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-foreground flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-primary" />
                <span>{event.name}</span>
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
                  {event.name}
                </h1>

                {/* Event Tree Switcher */}
                {allEvents.length > 1 && onSwitchEvent && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1">
                        <FolderGit2 className="h-3.5 w-3.5" />
                        <span>Switch Event</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-y-auto">
                      {allEvents.map((e) => (
                        <DropdownMenuItem
                          key={e._id}
                          onClick={() => onSwitchEvent(e)}
                          className={`text-xs flex items-center justify-between cursor-pointer ${
                            e._id === event._id ? "bg-muted font-bold" : ""
                          }`}
                        >
                          <span className="truncate">{e.name}</span>
                          <span className="text-[11px] text-muted-foreground ml-2">
                            {e.liveCertificateCount ?? e.certificatesGenerated ?? 0} certs
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {event.description || "Event Details & Template Configuration"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-background text-xs py-1 px-2.5">
              <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
              {event.date ? new Date(event.date).toLocaleDateString() : "No date"}
            </Badge>
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20 text-xs py-1 px-2.5 font-semibold"
            >
              <Award className="h-3 w-3 mr-1" />
              Certificates: {event.liveCertificateCount ?? event.certificatesGenerated ?? 0}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Tabs Card */}
      <Card className="shadow-sm border">
        <CardContent className="p-4 sm:p-6">
          <Tabs defaultValue="template" className="w-full">
            <TabsList className="grid w-full sm:w-auto sm:inline-grid grid-cols-3 mb-6">
              <TabsTrigger value="template" className="text-xs sm:text-sm">
                <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                Template Preview
              </TabsTrigger>
              <TabsTrigger value="fields" className="text-xs sm:text-sm">
                <Layers className="h-3.5 w-3.5 mr-1.5" />
                Field Config ({fields.length})
              </TabsTrigger>
              <TabsTrigger value="batches" className="text-xs sm:text-sm">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                Linked Batches ({linkedBatches.length})
              </TabsTrigger>
            </TabsList>

            {/* Template Preview Tab */}
            <TabsContent value="template" className="space-y-4">
              <div className="flex items-center justify-between gap-2 p-3 bg-muted/40 rounded-lg border text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-semibold text-muted-foreground">S3 Key:</span>
                  <span className="font-mono text-foreground truncate max-w-sm sm:max-w-md">
                    {event.templateS3Key || "None"}
                  </span>
                </div>
                {signedUrl && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOverlays(!showOverlays)}
                      className="h-7 text-xs bg-background"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {showOverlays ? "Hide Overlays" : "Show Overlays"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-7 text-xs"
                    >
                      <a href={signedUrl} target="_blank" rel="noreferrer">
                        <Maximize2 className="h-3 w-3 mr-1" />
                        Full Image
                      </a>
                    </Button>
                  </div>
                )}
              </div>

              {loadingTemplate ? (
                <div className="h-96 flex flex-col items-center justify-center gap-2 border rounded-xl bg-muted/20">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Loading certificate template preview...</span>
                </div>
              ) : templateError ? (
                <div className="h-96 flex flex-col items-center justify-center gap-2 border rounded-xl bg-rose-50/50 p-6 text-center">
                  <ImageIcon className="h-8 w-8 text-rose-500" />
                  <p className="font-medium text-sm text-rose-800">Failed to render template image</p>
                  <p className="text-xs text-rose-600 max-w-md">{templateError}</p>
                </div>
              ) : signedUrl ? (
                <div className="relative border rounded-xl overflow-hidden bg-neutral-900 flex items-center justify-center p-4 shadow-inner min-h-[500px]">
                  <div className="relative inline-block max-w-full">
                    {/* Template Image */}
                    <img
                      src={signedUrl}
                      alt="Certificate Template"
                      className="max-h-[600px] w-auto object-contain rounded-lg shadow-2xl block"
                    />

                    {/* Field Overlays visual guide */}
                    {showOverlays && fields.length > 0 && (
                      <div className="absolute inset-0 pointer-events-none">
                        {fields.map((field, idx) => (
                          <div
                            key={idx}
                            style={{
                              left: `${field.x}%`,
                              top: `${field.y}%`,
                              transform:
                                field.alignment === "center" || field.align === "center"
                                  ? "translate(-50%, -50%)"
                                  : field.alignment === "right" || field.align === "right"
                                  ? "translate(-100%, -50%)"
                                  : "translate(0, -50%)",
                            }}
                            className="absolute pointer-events-auto"
                          >
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-primary text-primary-foreground shadow border border-white/50 cursor-default">
                              {field.name || field.id || `Field ${idx + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center gap-2 border rounded-xl bg-muted/10 text-muted-foreground">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium">No template image uploaded</p>
                  <p className="text-xs text-muted-foreground">This event does not have an S3 template configured.</p>
                </div>
              )}
            </TabsContent>

            {/* Field Configuration Tab */}
            <TabsContent value="fields">
              {fields.length === 0 ? (
                <div className="h-72 flex flex-col items-center justify-center gap-2 border rounded-xl bg-muted/10 text-muted-foreground">
                  <Layers className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium">No field configuration defined</p>
                  <p className="text-xs text-muted-foreground">
                    This event has not configured dynamic text placements yet.
                  </p>
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-semibold text-xs">Field Name</TableHead>
                        <TableHead className="font-semibold text-xs">Position (X, Y)</TableHead>
                        <TableHead className="font-semibold text-xs">Font Size</TableHead>
                        <TableHead className="font-semibold text-xs">Font Family</TableHead>
                        <TableHead className="font-semibold text-xs">Color</TableHead>
                        <TableHead className="font-semibold text-xs">Alignment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((f, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm">
                            <span className="font-mono text-xs bg-primary/10 text-primary px-2.5 py-1 rounded">
                              {f.name || f.id || `Field ${i + 1}`}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            X: {f.x}% , Y: {f.y}%
                          </TableCell>
                          <TableCell className="text-xs font-semibold">{f.fontSize}px</TableCell>
                          <TableCell className="text-xs capitalize">{f.fontFamily || "Default"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-3.5 h-3.5 rounded border shadow-sm"
                                style={{ backgroundColor: f.color || "#000000" }}
                              />
                              <span className="font-mono text-xs">{f.color || "#000000"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs capitalize">
                            {f.alignment || f.align || "center"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Linked Batches Tab */}
            <TabsContent value="batches">
              {linkedBatches.length === 0 ? (
                <div className="h-72 flex flex-col items-center justify-center gap-2 border rounded-xl bg-muted/10 text-muted-foreground">
                  <FileSpreadsheet className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium">No certificate batches generated yet</p>
                  <p className="text-xs text-muted-foreground">
                    Certificates generated for this event will appear here for deep audit.
                  </p>
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-semibold text-xs">Batch ID</TableHead>
                        <TableHead className="font-semibold text-xs">Certificates</TableHead>
                        <TableHead className="font-semibold text-xs">Generated At</TableHead>
                        <TableHead className="w-36 text-right font-semibold text-xs">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linkedBatches.map((b) => (
                        <TableRow key={b._id}>
                          <TableCell className="font-mono text-xs font-medium">
                            {b.batchId || b._id}
                          </TableCell>
                          <TableCell className="text-sm font-semibold">
                            <Badge variant="outline">{b.certificateCount} recipients</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {b.createdAt ? new Date(b.createdAt).toLocaleString() : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {onInspectBatch && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => onInspectBatch(b._id, event.name, b.batchId)}
                                className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Inspect CSV
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
