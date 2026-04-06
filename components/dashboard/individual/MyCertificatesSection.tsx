"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Download, Search, Award, Filter, ChevronLeft, ChevronRight, X, Share2, ExternalLink, MoreHorizontal, CheckCircle2, Copy, Printer } from "lucide-react"
import { FaLinkedin, FaWhatsapp, FaTwitter } from "react-icons/fa"
import { HiMail } from "react-icons/hi"
import { BsFiletypePng, BsFiletypePdf } from "react-icons/bs"
import Image from "next/image"
import { useSocket } from "@/components/socket-provider"
import { toast } from "sonner"
import jsPDF from "jspdf"
import { renderWatermark } from "@/lib/watermark-utils"

interface Certificate {
  _id: string
  verificationId: string
  recipientName: string
  recipientEmail: string
  eventName: string
  issuedDate: string
  templateS3Key?: string
  fieldConfiguration?: any[]
  eventId?: string
  organizationName?: string
  privateOrgName?: string
  watermarkEnabledAtIssue?: boolean
}

interface MyCertificatesSectionProps {
  userId?: string
}

export function MyCertificatesSection({ userId }: MyCertificatesSectionProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [certificateImages, setCertificateImages] = useState<Record<string, string>>({}) // Store rendered certificate images
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({})
  const [downloadFormat, setDownloadFormat] = useState<"png" | "pdf">("png")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerCertificate, setDrawerCertificate] = useState<Certificate | null>(null)
  const itemsPerPage = 8
  const { socket } = useSocket()
  const componentRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCertificates()
  }, [userId])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showDetailModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showDetailModal])

  // Listen for real-time certificate updates
  useEffect(() => {
    if (!socket) return

    socket.on('new-certificate', (data) => {
      console.log('📢 New certificate received:', data)
      toast.success('New Certificate Received!', {
        description: `${data.eventName} certificate is now available`,
      })
      fetchCertificates() // Refresh list
    })

    return () => {
      socket.off('new-certificate')
    }
  }, [socket])

  useEffect(() => {
    if (searchQuery) {
      const filtered = certificates.filter(cert =>
        cert.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cert.organizationName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cert.privateOrgName?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredCertificates(filtered)
      setCurrentPage(1) // Reset to page 1 when searching
    } else {
      setFilteredCertificates(certificates)
    }
  }, [searchQuery, certificates])

  // Scroll to component top when page changes
  useEffect(() => {
    if (componentRef.current) {
      // Scroll to the component with offset for header
      const headerOffset = 100
      const elementPosition = componentRef.current.getBoundingClientRect().top + window.scrollY
      window.scrollTo({
        top: elementPosition - headerOffset,
        behavior: 'smooth'
      })
    }
  }, [currentPage])

  // Calculate pagination
  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCertificates = filteredCertificates.slice(startIndex, endIndex)

  // Reset to page 1 if current page exceeds total pages
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1)
  }

  const fetchCertificates = async () => {
    try {
      const response = await fetch('/api/my-certificates')
      const data = await response.json()

      if (data.success) {
        console.log('[MyCertificates] Fetched certificates:', {
          count: data.certificates?.length,
          firstCertData: data.certificates?.[0] ? {
            eventName: data.certificates[0].eventName,
            organizationName: data.certificates[0].organizationName,
            privateOrgName: data.certificates[0].privateOrgName,
            issuedDate: data.certificates[0].issuedDate,
          } : 'N/A'
        })
        setCertificates(data.certificates || [])
        setFilteredCertificates(data.certificates || [])
      }
    } catch (error) {
      console.error('Error fetching certificates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Render certificate from template and field config
  const renderCertificateImage = async (cert: Certificate) => {
    let templateS3Key = cert.templateS3Key
    let fieldConfig = cert.fieldConfiguration

    console.log(`[MyCertificates] Starting render for ${cert._id}:`, {
      hasCertTemplate: !!cert.templateS3Key,
      hasCertConfig: !!cert.fieldConfiguration,
      hasEventId: !!cert.eventId,
    })

    // If certificate doesn't have template/config, try to fetch from event
    if ((!templateS3Key || !fieldConfig) && cert.eventId) {
      try {
        console.log(`[MyCertificates] Fetching event data for ${cert.eventId}`)
        const eventResponse = await fetch(`/api/events/${cert.eventId}`)
        const eventData = await eventResponse.json()

        if (eventData.success && eventData.event) {
          templateS3Key = templateS3Key || eventData.event.templateS3Key
          fieldConfig = fieldConfig || eventData.event.fieldConfiguration
          console.log(`[MyCertificates] Got template from event:`, {
            hasTemplate: !!templateS3Key,
            hasConfig: !!fieldConfig,
            templateKey: templateS3Key,
          })
        }
      } catch (error) {
        console.error('[MyCertificates] Error fetching event:', error)
      }
    }

    if (!templateS3Key || !fieldConfig) {
      console.log(`[MyCertificates] Certificate ${cert._id} missing template or config after fallback`)
      return null
    }

    try {
      setLoadingImages(prev => ({ ...prev, [cert._id]: true }))

      // Get signed URL for template
      console.log(`[MyCertificates] Getting signed URL for key: ${templateS3Key}`)
      const templateResponse = await fetch(
        `/api/templates/signed-url?key=${encodeURIComponent(templateS3Key)}`
      )
      const templateData = await templateResponse.json()

      console.log(`[MyCertificates] Signed URL response:`, {
        success: templateData.success,
        hasUrl: !!templateData.signedUrl,
      })

      if (!templateData.success || !templateData.signedUrl) {
        console.error('[MyCertificates] Failed to get template URL:', templateData.error)
        return null
      }

      // Load template image via proxy to avoid S3 CORS issues
      const proxiedUrl = `/api/templates/proxy?url=${encodeURIComponent(templateData.signedUrl)}`
      console.log(`[MyCertificates] Loading template via proxy`, { proxiedUrl })
      const img: HTMLImageElement = document.createElement('img')
      img.crossOrigin = 'anonymous'

      return new Promise<string | null>((resolve) => {
        img.onload = () => {
          console.log(`[MyCertificates] Template image loaded, creating canvas`)

          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          console.log(`[MyCertificates] Canvas context:`, {
            canvasExists: !!canvas,
            ctxExists: !!ctx,
            ctxType: ctx?.constructor.name,
            hasDrawImage: !!ctx?.drawImage,
          })

          if (!ctx) {
            console.error('[MyCertificates] Failed to get canvas context')
            resolve(null)
            return
          }

          canvas.width = img.width
          canvas.height = img.height

          console.log(`[MyCertificates] Canvas size: ${canvas.width}x${canvas.height}`)

          try {
            ctx.drawImage(img, 0, 0)
            console.log(`[MyCertificates] Template drawn to canvas`)
          } catch (drawError) {
            console.error('[MyCertificates] Error drawing image:', drawError)
            resolve(null)
            return
          }

          // Draw demo text for each field
          (fieldConfig || []).forEach((field: any) => {
            let demoText = 'Demo Text'
            if (field.name === 'Name') demoText = cert.recipientName
            else if (field.name === 'Date') demoText = new Date(cert.issuedDate).toLocaleDateString()
            else if (field.name === 'Course') demoText = cert.eventName

            const fontWeight = field.fontWeight === 400 ? '' : field.fontWeight
            const fontString = fontWeight
              ? `${fontWeight} ${field.fontSize}px "${field.fontFamily}"`
              : `${field.fontSize}px "${field.fontFamily}"`

            try {
              ctx.font = fontString
              ctx.fillStyle = field.color
              ctx.textAlign = field.alignment as any

              const x =
                field.alignment === 'center' ? field.x : field.alignment === 'right' ? field.x + (field.maxWidth || 0) : field.x
              ctx.fillText(demoText, x, field.y, field.maxWidth)
            } catch (textError) {
              console.error('[MyCertificates] Error drawing text for field:', field.name, textError)
            }
          })

          // Immutable rule: use watermark setting captured at issuance.
          if (cert.watermarkEnabledAtIssue !== false) {
            renderWatermark(ctx, canvas.width, canvas.height, 1)
          }

          console.log(`[MyCertificates] Text drawn, converting to data URL`)
          const imageData = canvas.toDataURL('image/png')
          console.log(`[MyCertificates] Image data created, size: ${imageData.length} bytes`)
          setCertificateImages(prev => ({ ...prev, [cert._id]: imageData }))
          resolve(imageData)
        }

        img.onerror = () => {
          console.error('[MyCertificates] Failed to load template image from proxy:', proxiedUrl)
          resolve(null)
        }

        img.src = proxiedUrl
      })
    } catch (error) {
      console.error('[MyCertificates] Error rendering certificate:', error)
      return null
    } finally {
      setLoadingImages(prev => ({ ...prev, [cert._id]: false }))
    }
  }

  // Render images when certificates load
  useEffect(() => {
    certificates.forEach(cert => {
      if (!certificateImages[cert._id] && !loadingImages[cert._id]) {
        renderCertificateImage(cert)
      }
    })
  }, [certificates])

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#21808D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your certificates...</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="verified">Verified</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 gap-1 text-sm">
              <Filter className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Filter</span>
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-sm">
              <Download className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Export</span>
            </Button>
          </div>
        </div>
        <TabsContent value="all">
          <Card>
            <CardHeader className="px-7">
              <CardTitle>Certificates</CardTitle>
              <CardDescription>
                Recent certificates issued to you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input
                    type="search"
                    placeholder="Search certificates..."
                    className="w-full pl-8 sm:w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">Preview</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Verification Link</TableHead>
                    <TableHead className="table-cell lg:hidden text-center">Link</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">Loading...</TableCell>
                    </TableRow>
                  ) : filteredCertificates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">No certificates found.</TableCell>
                    </TableRow>
                  ) : (
                    currentCertificates.map((cert) => (
                      <TableRow key={cert._id} className="hover:bg-neutral-50/50">
                        <TableCell className="hidden sm:table-cell cursor-pointer" onClick={() => { setSelectedCertificate(cert); setShowDetailModal(true); }}>
                          <div className="h-10 w-16 bg-neutral-100 rounded border overflow-hidden">
                            {certificateImages[cert._id] ? (
                              <img src={certificateImages[cert._id]} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Award className="w-4 h-4 text-neutral-300" /></div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="cursor-pointer" onClick={() => { setSelectedCertificate(cert); setShowDetailModal(true); }}>
                          <div className="font-medium text-neutral-900">{cert.eventName}</div>
                          <div className="hidden text-xs text-neutral-500 md:inline">
                            {cert.organizationName || cert.privateOrgName}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell cursor-pointer" onClick={() => { setSelectedCertificate(cert); setShowDetailModal(true); }}>
                          <Badge className="text-xs" variant="secondary">Verified</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell cursor-pointer" onClick={() => { setSelectedCertificate(cert); setShowDetailModal(true); }}>
                          {new Date(cert.issuedDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-neutral-100 px-2 py-1 rounded truncate max-w-[200px] block">
                              {`${window.location.origin}/verify/${cert.verificationId}`}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigator.clipboard.writeText(`${window.location.origin}/verify/${cert.verificationId}`)
                                toast.success('Verification link copied!')
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                        {/* Mobile - Show copy button */}
                        <TableCell className="table-cell lg:hidden text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(`${window.location.origin}/verify/${cert.verificationId}`)
                              toast.success('Link copied!')
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-neutral-100 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDrawerCertificate(cert)
                              setDrawerOpen(true)
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Certificate Detail Modal - Compact UI */}
      {
        showDetailModal && selectedCertificate && (
          <div 
            className="fixed inset-0 bg-[#f6f6f6]/95 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-3 md:p-4 overflow-y-auto"
            onClick={(e) => {
              // Close modal when clicking on backdrop
              if (e.target === e.currentTarget) {
                setShowDetailModal(false)
                setSelectedCertificate(null)
              }
            }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <Card 
              className="bg-white rounded-lg md:rounded-xl max-w-[95vw] sm:max-w-md md:max-w-3xl lg:max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-[90vh] relative my-auto"
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {/* Close Button - Top Right */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedCertificate(null)
                }}
                className="absolute top-2 right-2 z-20 h-7 w-7 md:h-8 md:w-8 rounded-full hover:bg-gray-100 bg-white/90 backdrop-blur-sm shadow-sm"
              >
                <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>

              {/* Modal Content */}
              <div 
                className="overflow-y-auto flex-1 p-3 sm:p-4 md:p-6 pt-10 md:pt-12"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                {/* Desktop: Two Column Layout, Mobile: Single Column */}
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                  {/* Certificate Preview */}
                  <div className="lg:flex-1 mb-3 sm:mb-4 lg:mb-0 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                    {certificateImages[selectedCertificate._id] ? (
                      <div className="flex items-center justify-center bg-white p-2 sm:p-3 md:p-4 lg:p-6">
                        <img
                          src={certificateImages[selectedCertificate._id]}
                          alt={selectedCertificate.eventName}
                          className="w-full h-auto max-h-48 sm:max-h-64 md:max-h-80 lg:max-h-[500px] object-contain"
                        />
                      </div>
                    ) : loadingImages[selectedCertificate._id] ? (
                      <div className="h-40 sm:h-56 md:h-72 lg:h-96 bg-gray-100 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 border-3 border-[#21808D] border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[10px] sm:text-xs md:text-sm text-gray-600 font-medium">Rendering certificate...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 sm:h-56 md:h-72 lg:h-96 bg-gradient-to-br from-[#21808D] to-[#8FD6BD] flex items-center justify-center">
                        <Award className="w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 text-white/60" />
                      </div>
                    )}
                  </div>

                  {/* Certificate Information */}
                  <div className="lg:flex-1 flex flex-col">
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      <div className="pb-2 sm:pb-3 border-b border-gray-100">
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Event Name</p>
                        <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mt-1 sm:mt-1.5">{selectedCertificate.eventName}</p>
                      </div>
                      <div className="pb-2 sm:pb-3 border-b border-gray-100">
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Organization</p>
                        <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mt-1 sm:mt-1.5">
                          {selectedCertificate.organizationName || selectedCertificate.privateOrgName || "N/A"}
                        </p>
                      </div>
                      <div className="pb-2 sm:pb-3 border-b border-gray-100">
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Recipient Name</p>
                        <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mt-1 sm:mt-1.5">{selectedCertificate.recipientName}</p>
                      </div>
                      <div className="pb-2 sm:pb-3 border-b border-gray-100">
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Address</p>
                        <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mt-1 sm:mt-1.5 break-all">{selectedCertificate.recipientEmail}</p>
                      </div>
                      <div className="pb-2 sm:pb-3 border-b border-gray-100">
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Date Issued</p>
                        <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mt-1 sm:mt-1.5">
                          {new Date(selectedCertificate.issuedDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="pb-2 sm:pb-3">
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Certificate ID</p>
                        <div className="flex items-center gap-2 mt-1 sm:mt-1.5">
                          <p className="text-[10px] sm:text-xs md:text-sm font-mono text-gray-600 truncate flex-1">{selectedCertificate.verificationId || selectedCertificate._id}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-[#21808D]/10"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedCertificate.verificationId || selectedCertificate._id)
                              toast.success('Certificate ID copied!')
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#21808D]">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer - Compact */}
              <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50">
                {/* Format Selector - Compact */}
                <div className="flex gap-1 sm:gap-1.5 p-0.5 bg-slate-100 rounded-lg w-fit mb-2 sm:mb-3">
                  <button
                    onClick={() => setDownloadFormat('png')}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors ${downloadFormat === 'png'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    PNG
                  </button>
                  <button
                    onClick={() => setDownloadFormat('pdf')}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors ${downloadFormat === 'pdf'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    PDF
                  </button>
                </div>

                {/* Action Buttons - Compact */}
                <div className="flex gap-1.5 sm:gap-2">
                  <Button
                    size="sm"
                    className="bg-[#21808D] hover:bg-[#1a6370] h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs flex-1 sm:flex-initial"
                    onClick={async () => {
                      if (!selectedCertificate) return

                      const fileName = `certificate-${selectedCertificate.recipientName.replace(/\s+/g, '_')}`
                      const imgData = certificateImages[selectedCertificate._id]

                      if (!imgData) {
                        toast.error('Certificate image not ready')
                        return
                      }

                      if (downloadFormat === 'pdf') {
                        try {
                          const tempCanvas = document.createElement('canvas')
                          const img = new window.Image()

                          await new Promise((resolve, reject) => {
                            img.onload = resolve
                            img.onerror = reject
                            img.src = imgData
                          })

                          tempCanvas.width = img.width
                          tempCanvas.height = img.height
                          const ctx = tempCanvas.getContext('2d')
                          if (!ctx) throw new Error('Failed to get canvas context')
                          ctx.drawImage(img, 0, 0)

                          const canvasWidth = tempCanvas.width
                          const canvasHeight = tempCanvas.height
                          const aspectRatio = canvasWidth / canvasHeight
                          const isLandscape = aspectRatio > 1
                          const pdf = new jsPDF({
                            orientation: isLandscape ? 'l' : 'p',
                            unit: 'mm',
                            format: 'a4'
                          })

                          const pageWidth = pdf.internal.pageSize.getWidth()
                          const pageHeight = pdf.internal.pageSize.getHeight()
                          const margin = 10
                          const maxWidth = pageWidth - (2 * margin)
                          const maxHeight = pageHeight - (2 * margin)

                          let imgWidth = maxWidth
                          let imgHeight = imgWidth / aspectRatio

                          if (imgHeight > maxHeight) {
                            imgHeight = maxHeight
                            imgWidth = imgHeight * aspectRatio
                          }

                          const x = (pageWidth - imgWidth) / 2
                          const y = (pageHeight - imgHeight) / 2

                          pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight)

                          const verificationUrl = `${window.location.origin}/verify/${selectedCertificate.verificationId}`
                          pdf.setFontSize(10)
                          pdf.setTextColor(100, 100, 100)
                          const bottomY = pageHeight - 5
                          pdf.text('Verify this certificate:', margin, bottomY)
                          pdf.setTextColor(33, 128, 141)
                          pdf.textWithLink(verificationUrl, margin + 45, bottomY, { url: verificationUrl })

                          const pdfArrayBuffer = pdf.output('arraybuffer')

                          if (!pdfArrayBuffer || pdfArrayBuffer.byteLength < 1000) {
                            throw new Error('Generated PDF is too small or invalid')
                          }

                          const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' })
                          const url = URL.createObjectURL(pdfBlob)
                          const link = document.createElement('a')
                          link.href = url
                          link.download = `${fileName}.pdf`
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                          setTimeout(() => URL.revokeObjectURL(url), 100)
                          toast.success('Certificate downloaded as PDF')
                        } catch (error) {
                          console.error('PDF generation failed:', error)
                          toast.error('Failed to generate PDF')
                        }
                      } else {
                        const link = document.createElement('a')
                        link.href = imgData
                        link.download = `${fileName}.png`
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                        toast.success('Certificate downloaded as PNG')
                      }
                    }}
                  >
                    <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                    Download {downloadFormat.toUpperCase()}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 sm:h-8 md:h-9 flex-1 sm:flex-initial text-[10px] sm:text-xs">
                        <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                        Share
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => {
                          if (!selectedCertificate) return
                          const verificationUrl = `${window.location.origin}/verify/${selectedCertificate.verificationId}`
                          const issueDate = new Date(selectedCertificate.issuedDate)
                          const addToProfileUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(selectedCertificate.eventName)}&organizationName=${encodeURIComponent(selectedCertificate.organizationName || selectedCertificate.privateOrgName || '')}&issueYear=${issueDate.getFullYear()}&issueMonth=${issueDate.getMonth() + 1}&certUrl=${encodeURIComponent(verificationUrl)}&certId=${selectedCertificate.verificationId}`
                          window.open(addToProfileUrl, '_blank')
                          toast.success('Opening LinkedIn')
                        }}
                      >
                        <FaLinkedin className="w-4 h-4 mr-2 text-[#0077b5]" />
                        Add to LinkedIn
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (!selectedCertificate) return
                          const verificationUrl = `${window.location.origin}/verify/${selectedCertificate.verificationId}`
                          const text = `I've earned a certificate for ${selectedCertificate.eventName}! Check it out:`
                          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(verificationUrl)}`
                          window.open(twitterUrl, '_blank', 'width=600,height=600')
                          toast.success('Opening Twitter/X')
                        }}
                      >
                        <FaTwitter className="w-4 h-4 mr-2 text-[#1DA1F2]" />
                        Share on Twitter
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (!selectedCertificate) return
                          const verificationUrl = `${window.location.origin}/verify/${selectedCertificate.verificationId}`
                          const text = `I've earned a certificate for ${selectedCertificate.eventName}! ${verificationUrl}`
                          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
                          window.open(whatsappUrl, '_blank')
                          toast.success('Opening WhatsApp')
                        }}
                      >
                        <FaWhatsapp className="w-4 h-4 mr-2 text-[#25D366]" />
                        Share on WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (!selectedCertificate) return
                          const verificationUrl = `${window.location.origin}/verify/${selectedCertificate.verificationId}`
                          const subject = `Certificate: ${selectedCertificate.eventName}`
                          const body = `I'm excited to share that I've earned a certificate for ${selectedCertificate.eventName}!\n\nYou can verify it here: ${verificationUrl}`
                          const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                          window.location.href = mailtoUrl
                          toast.success('Opening email client')
                        }}
                      >
                        <HiMail className="w-4 h-4 mr-2 text-red-500" />
                        Share via Email
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          </div>
        )
      }

      {/* Actions Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="md:max-w-[95%] lg:max-w-[45%] mx-auto rounded-t-2xl">
          <DrawerHeader className="pb-3 relative">
            <DrawerTitle className="text-base">Certificate Actions</DrawerTitle>
            <DrawerDescription className="text-xs">
              {drawerCertificate?.eventName}
            </DrawerDescription>
            {/* Close Button */}
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </DrawerHeader>
          <div className="px-6 pb-6 space-y-4">
            {/* Share Options */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wide">Share Certificate</p>
              <div className="flex items-center gap-3 justify-center">
                {/* WhatsApp */}
                <button
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1faa52] transition-colors duration-200 shadow-md"
                  onClick={() => {
                    if (!drawerCertificate) return
                    const verificationUrl = `${window.location.origin}/verify/${drawerCertificate.verificationId}`
                    const text = `I've earned a certificate for ${drawerCertificate.eventName}! ${verificationUrl}`
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
                    window.open(whatsappUrl, '_blank')
                    toast.success('Opening WhatsApp')
                    setDrawerOpen(false)
                  }}
                >
                  <FaWhatsapp className="w-6 h-6 text-white" />
                </button>

                {/* LinkedIn */}
                <button
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-[#0077b5] hover:bg-[#005885] transition-colors duration-200 shadow-md"
                  onClick={() => {
                    if (!drawerCertificate) return
                    const verificationUrl = `${window.location.origin}/verify/${drawerCertificate.verificationId}`
                    const issueDate = new Date(drawerCertificate.issuedDate)
                    const addToProfileUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(drawerCertificate.eventName)}&organizationName=${encodeURIComponent(drawerCertificate.organizationName || drawerCertificate.privateOrgName || '')}&issueYear=${issueDate.getFullYear()}&issueMonth=${issueDate.getMonth() + 1}&certUrl=${encodeURIComponent(verificationUrl)}&certId=${drawerCertificate.verificationId}`
                    window.open(addToProfileUrl, '_blank')
                    toast.success('Opening LinkedIn')
                    setDrawerOpen(false)
                  }}
                >
                  <FaLinkedin className="w-6 h-6 text-white" />
                </button>

                {/* Instagram - Share via DM or copy link */}
                <button
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] hover:opacity-80 transition-opacity duration-200 shadow-md"
                  onClick={() => {
                    if (!drawerCertificate) return
                    const verificationUrl = `${window.location.origin}/verify/${drawerCertificate.verificationId}`
                    navigator.clipboard.writeText(verificationUrl)
                    toast.success('Link copied! Share on Instagram')
                    setDrawerOpen(false)
                  }}
                >
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </button>

                {/* Email */}
                <button
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-[#EA4335] hover:bg-[#c5372f] transition-colors duration-200 shadow-md"
                  onClick={() => {
                    if (!drawerCertificate) return
                    const verificationUrl = `${window.location.origin}/verify/${drawerCertificate.verificationId}`
                    const subject = `Certificate: ${drawerCertificate.eventName}`
                    const body = `I'm excited to share that I've earned a certificate for ${drawerCertificate.eventName}!\n\nYou can verify it here: ${verificationUrl}`
                    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                    window.location.href = mailtoUrl
                    toast.success('Opening email client')
                    setDrawerOpen(false)
                  }}
                >
                  <HiMail className="w-6 h-6 text-white" />
                </button>

                {/* Twitter */}
                <button
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-[#1DA1F2] hover:bg-[#1a8cd8] transition-colors duration-200 shadow-md"
                  onClick={() => {
                    if (!drawerCertificate) return
                    const verificationUrl = `${window.location.origin}/verify/${drawerCertificate.verificationId}`
                    const text = `I've earned a certificate for ${drawerCertificate.eventName}! Check it out:`
                    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(verificationUrl)}`
                    window.open(twitterUrl, '_blank', 'width=600,height=600')
                    toast.success('Opening Twitter/X')
                    setDrawerOpen(false)
                  }}
                >
                  <FaTwitter className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Share Verification Link */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wide">Share Verification Link</p>
              <button
                className="flex items-center justify-center gap-2 w-full h-10 rounded-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-colors duration-200 shadow-sm text-white font-medium text-sm"
                onClick={() => {
                  if (!drawerCertificate) return
                  const verificationUrl = `${window.location.origin}/verify/${drawerCertificate.verificationId}`
                  navigator.clipboard.writeText(verificationUrl)
                  toast.success('Verification link copied to clipboard!')
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Verification Link
              </button>
            </div>

            {/* Download Options */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wide">Download & Print</p>
              <div className="flex items-center gap-3 justify-center">
                {/* Download PNG */}
                <button
                  className="flex items-center justify-center w-12 h-12 rounded-lg border-2 border-border bg-background hover:bg-accent hover:border-accent-foreground/20 transition-colors duration-200"
                  onClick={async () => {
                    if (!drawerCertificate) return

                    const fileName = `certificate-${drawerCertificate.recipientName.replace(/\s+/g, '_')}`
                    const imgData = certificateImages[drawerCertificate._id]

                    if (!imgData) {
                      toast.error('Certificate image not ready')
                      return
                    }

                    const link = document.createElement('a')
                    link.href = imgData
                    link.download = `${fileName}.png`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    toast.success('Downloaded as PNG!')
                    setDrawerOpen(false)
                  }}
                >
                  <BsFiletypePng className="w-5 h-5 text-foreground" />
                </button>

                {/* Download PDF */}
                <button
                  className="flex items-center justify-center w-12 h-12 rounded-lg border-2 border-border bg-background hover:bg-accent hover:border-accent-foreground/20 transition-colors duration-200"
                  onClick={async () => {
                    if (!drawerCertificate) return

                    const fileName = `certificate-${drawerCertificate.recipientName.replace(/\s+/g, '_')}`
                    const imgData = certificateImages[drawerCertificate._id]

                    if (!imgData) {
                      toast.error('Certificate image not ready')
                      return
                    }

                    try {
                      const tempCanvas = document.createElement('canvas')
                      const img = new window.Image()

                      await new Promise((resolve, reject) => {
                        img.onload = resolve
                        img.onerror = reject
                        img.src = imgData
                      })

                      tempCanvas.width = img.width
                      tempCanvas.height = img.height
                      const ctx = tempCanvas.getContext('2d')
                      if (!ctx) throw new Error('Failed to get canvas context')
                      ctx.drawImage(img, 0, 0)

                      const canvasWidth = tempCanvas.width
                      const canvasHeight = tempCanvas.height
                      const aspectRatio = canvasWidth / canvasHeight
                      const isLandscape = aspectRatio > 1
                      const pdf = new jsPDF({
                        orientation: isLandscape ? 'l' : 'p',
                        unit: 'mm',
                        format: 'a4'
                      })

                      const pageWidth = pdf.internal.pageSize.getWidth()
                      const pageHeight = pdf.internal.pageSize.getHeight()
                      const margin = 10
                      const maxWidth = pageWidth - (2 * margin)
                      const maxHeight = pageHeight - (2 * margin)

                      let imgWidth = maxWidth
                      let imgHeight = imgWidth / aspectRatio

                      if (imgHeight > maxHeight) {
                        imgHeight = maxHeight
                        imgWidth = imgHeight * aspectRatio
                      }

                      const x = (pageWidth - imgWidth) / 2
                      const y = (pageHeight - imgHeight) / 2

                      pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight)

                      const verificationUrl = `${window.location.origin}/verify/${drawerCertificate.verificationId}`
                      pdf.setFontSize(10)
                      pdf.setTextColor(100, 100, 100)
                      const bottomY = pageHeight - 5
                      pdf.text('Verify this certificate:', margin, bottomY)
                      pdf.setTextColor(33, 128, 141)
                      pdf.textWithLink(verificationUrl, margin + 45, bottomY, { url: verificationUrl })

                      const pdfArrayBuffer = pdf.output('arraybuffer')

                      if (!pdfArrayBuffer || pdfArrayBuffer.byteLength < 1000) {
                        throw new Error('Generated PDF is too small or invalid')
                      }

                      const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' })
                      const url = URL.createObjectURL(pdfBlob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = `${fileName}.pdf`
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                      setTimeout(() => URL.revokeObjectURL(url), 100)
                      toast.success('Downloaded as PDF!')
                      setDrawerOpen(false)
                    } catch (error) {
                      console.error('PDF generation failed:', error)
                      toast.error('Failed to generate PDF')
                    }
                  }}
                >
                  <BsFiletypePdf className="w-5 h-5 text-foreground" />
                </button>

                {/* Print */}
                <button
                  className="flex items-center justify-center w-12 h-12 rounded-lg border-2 border-border bg-background hover:bg-accent hover:border-accent-foreground/20 transition-colors duration-200"
                onClick={() => {
                if (!drawerCertificate) return
                const imgData = certificateImages[drawerCertificate._id]

                if (!imgData) {
                  toast.error('Certificate image not ready')
                  return
                }

                const printWindow = window.open('', '_blank')
                if (printWindow) {
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Print Certificate</title>
                        <style>
                          body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                          img { max-width: 100%; height: auto; }
                        </style>
                      </head>
                      <body>
                        <img src="${imgData}" onload="window.print(); window.close();" />
                      </body>
                    </html>
                  `)
                  printWindow.document.close()
                }
                setDrawerOpen(false)
              }}
            >
              <Printer className="w-5 h-5 text-foreground" />
            </button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
