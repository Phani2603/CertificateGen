"use client"

import { useEffect, useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, Search, Award, Filter, ChevronLeft, ChevronRight, X, Share2, Linkedin, Send, Mail, ExternalLink } from "lucide-react"
import Image from "next/image"
import { useSocket } from "@/components/socket-provider"
import { toast } from "sonner"
import jsPDF from "jspdf"

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
  const itemsPerPage = 8
  const { socket } = useSocket()
  const componentRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCertificates()
  }, [userId])

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
      <div ref={componentRef} className="space-y-4 sm:space-y-6 lg:space-y-8 w-full">
        {/* Header - Responsive */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2 sm:gap-3">
              <Award className="w-5 sm:w-6 h-5 sm:h-6 text-[#8FD6BD]" />
              My Certificates
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm mt-2">
              {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned
            </p>
          </div>

          {/* Search - Responsive */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search certificates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>

        {/* Certificates Grid */}
        {filteredCertificates.length === 0 ? (
          <Card className="p-6 sm:p-8 lg:p-12">
            <div className="text-center">
              <Award className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? "No certificates found" : "No certificates yet"}
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                {searchQuery 
                  ? "Try adjusting your search query" 
                  : "Certificates you receive will appear here"
                }
              </p>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" ref={gridRef}>
              {currentCertificates.map((cert) => (
                <div 
                  key={cert._id} 
                  onClick={() => {
                    setSelectedCertificate(cert)
                    setShowDetailModal(true)
                  }}
                  className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#21808D] hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full"
                >
                  {/* Certificate Image Preview - Compact */}
                  <div className="relative h-32 bg-gradient-to-br from-[#21808D] to-[#8FD6BD] overflow-hidden flex items-center justify-center">
                    {certificateImages[cert._id] ? (
                      <>
                        <img 
                          src={certificateImages[cert._id]} 
                          alt={cert.eventName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                            <ExternalLink className="w-5 h-5 text-[#21808D]" />
                          </div>
                        </div>
                      </>
                    ) : loadingImages[cert._id] ? (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-white">Loading...</span>
                      </div>
                    ) : (
                      <Award className="w-10 h-10 text-white/60" />
                    )}
                  </div>

                  {/* Certificate Details - Compact */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-xs line-clamp-1 text-gray-900">{cert.eventName}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {cert.organizationName || cert.privateOrgName || "Organization"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5 font-medium">
                        {new Date(cert.issuedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </p>
                    </div>

                    {/* Quick Action Button */}
                    <Button
                      size="sm"
                      className="w-full mt-2 bg-[#21808D] hover:bg-[#1a6370] text-white h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCertificate(cert)
                        setShowDetailModal(true)
                      }}
                    >
                      <ExternalLink className="w-2.5 h-2.5 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="text-xs sm:text-sm text-gray-500 font-medium">
                  Showing <span className="font-semibold text-gray-900">{startIndex + 1}-{Math.min(endIndex, filteredCertificates.length)}</span> of <span className="font-semibold text-gray-900">{filteredCertificates.length}</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-9 w-9 p-0 rounded-lg border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-0.5 bg-gray-50 rounded-lg p-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`h-8 w-8 p-0 rounded-md transition-all ${
                              currentPage === page 
                                ? "bg-[#21808D] hover:bg-[#1a6370] text-white shadow-sm" 
                                : "text-gray-600 hover:bg-white hover:text-[#21808D]"
                            }`}
                          >
                            {page}
                          </Button>
                        )
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="px-2 text-gray-300 text-sm">
                            •••
                          </span>
                        )
                      }
                      return null
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-9 w-9 p-0 rounded-lg border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Certificate Detail Modal - Compact UI */}
      {showDetailModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-auto">
          <Card className="bg-white rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Close Button - Top Right */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setShowDetailModal(false)
                setSelectedCertificate(null)
              }}
              className="absolute top-2 right-2 z-20 h-8 w-8 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Modal Content */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-6">
              {/* Certificate Preview */}
              <div className="mb-4 sm:mb-6 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                {certificateImages[selectedCertificate._id] ? (
                  <div className="flex items-center justify-center bg-white p-3 sm:p-4 lg:p-6">
                    <img 
                      src={certificateImages[selectedCertificate._id]} 
                      alt={selectedCertificate.eventName}
                      className="w-full h-auto max-h-72 sm:max-h-96 object-contain"
                    />
                  </div>
                ) : loadingImages[selectedCertificate._id] ? (
                  <div className="h-48 sm:h-72 lg:h-96 bg-gray-100 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 border-3 border-[#21808D] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs sm:text-sm text-gray-600 font-medium">Rendering certificate...</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 sm:h-72 lg:h-96 bg-gradient-to-br from-[#21808D] to-[#8FD6BD] flex items-center justify-center">
                    <Award className="w-16 sm:w-20 lg:w-24 h-16 sm:h-20 lg:h-24 text-white/60" />
                  </div>
                )}
              </div>

              {/* Certificate Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-3">
                  <div className="pb-3 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Event Name</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1.5">{selectedCertificate.eventName}</p>
                  </div>
                  <div className="pb-3 sm:pb-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Organization</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1.5">
                      {selectedCertificate.organizationName || selectedCertificate.privateOrgName || "N/A"}
                    </p>
                  </div>
                  <div className="pb-3 sm:pb-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recipient Name</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1.5">{selectedCertificate.recipientName}</p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="pb-3 sm:pb-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Address</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1.5 break-all">{selectedCertificate.recipientEmail}</p>
                  </div>
                  <div className="pb-3 sm:pb-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date Issued</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1.5">
                      {new Date(selectedCertificate.issuedDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="pb-3 sm:pb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Certificate ID</p>
                    <p className="text-xs sm:text-sm font-mono text-gray-600 mt-1.5 truncate">{selectedCertificate.verificationId || selectedCertificate._id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Compact */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              {/* Format Selector - Compact */}
              <div className="flex gap-1.5 p-0.5 bg-slate-100 rounded-lg w-fit mb-3">
                <button
                  onClick={() => setDownloadFormat('png')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    downloadFormat === 'png'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PNG
                </button>
                <button
                  onClick={() => setDownloadFormat('pdf')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    downloadFormat === 'pdf'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PDF
                </button>
              </div>
              
              {/* Action Buttons - Compact */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-[#21808D] hover:bg-[#1a6370] h-9 text-xs"
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
                        // Create a temporary canvas to get the image
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
                        
                        // Get canvas dimensions
                        const canvasWidth = tempCanvas.width
                        const canvasHeight = tempCanvas.height
                        const aspectRatio = canvasWidth / canvasHeight
                        
                        // Determine orientation
                        const isLandscape = aspectRatio > 1
                        
                        // Create PDF
                        const pdf = new jsPDF({
                          orientation: isLandscape ? 'l' : 'p',
                          unit: 'mm',
                          format: 'a4'
                        })
                        
                        const pageWidth = pdf.internal.pageSize.getWidth()
                        const pageHeight = pdf.internal.pageSize.getHeight()
                        
                        // Calculate dimensions with margins
                        const margin = 10
                        const maxWidth = pageWidth - (2 * margin)
                        const maxHeight = pageHeight - (2 * margin)
                        
                        let imgWidth = maxWidth
                        let imgHeight = imgWidth / aspectRatio
                        
                        // If height exceeds, scale by height instead
                        if (imgHeight > maxHeight) {
                          imgHeight = maxHeight
                          imgWidth = imgHeight * aspectRatio
                        }
                        
                        // Center the image
                        const x = (pageWidth - imgWidth) / 2
                        const y = (pageHeight - imgHeight) / 2
                        
                        // Add image to PDF
                        pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight)
                        
                        // Add verification link at bottom - using verificationId
                        const verificationUrl = `${window.location.origin}/verify/${selectedCertificate.verificationId}`
                        pdf.setFontSize(10)
                        pdf.setTextColor(100, 100, 100)
                        const bottomY = pageHeight - 5
                        pdf.text('Verify this certificate:', margin, bottomY)
                        pdf.setTextColor(33, 128, 141)
                        pdf.textWithLink(verificationUrl, margin + 45, bottomY, { url: verificationUrl })
                        
                        // Use arraybuffer (most reliable method)
                        const pdfArrayBuffer = pdf.output('arraybuffer')
                        
                        // Validate PDF was generated
                        if (!pdfArrayBuffer || pdfArrayBuffer.byteLength < 1000) {
                          throw new Error('Generated PDF is too small or invalid')
                        }
                        
                        // Convert to Blob and download
                        const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' })
                        const url = URL.createObjectURL(pdfBlob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = `${fileName}.pdf`
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                        
                        // Clean up
                        setTimeout(() => URL.revokeObjectURL(url), 100)
                        
                        toast.success('Certificate downloaded as PDF')
                      } catch (error) {
                        console.error('PDF generation failed:', error)
                        toast.error('Failed to generate PDF')
                      }
                    } else {
                      // PNG download
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
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download {downloadFormat.toUpperCase()}
                </Button>
                
                {/* Share Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      <Share2 className="w-3.5 h-3.5 mr-1.5" />
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
                      <Linkedin className="w-4 h-4 mr-2" />
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
                      <Share2 className="w-4 h-4 mr-2" />
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
                      <Send className="w-4 h-4 mr-2" />
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
                      <Mail className="w-4 h-4 mr-2" />
                      Share via Email
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
