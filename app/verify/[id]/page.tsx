"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  CheckCircle2, 
  XCircle, 
  Download, 
  Share2, 
  FileText,
  Calendar,
  Building2,
  User,
  Award,
  ArrowLeft,
  Loader2
} from "lucide-react"

interface CertificateData {
  id: string
  recipientName: string
  recipientEmail: string
  eventName: string
  eventDate: string
  organizationName: string
  clubName: string
  issueDate: string
  certificateUrl: string
  isValid: boolean
  verificationCode: string
  eventId?: string // NEW: MongoDB ObjectId reference
}

interface FieldConfig {
  id: string
  name: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  color: string
  alignment?: CanvasTextAlign
  align?: CanvasTextAlign
  fontWeight?: number
  maxWidth?: number
}

export default function VerificationPage() {
  const params = useParams()
  const router = useRouter()
  const [certificate, setCertificate] = useState<CertificateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [templateUrl, setTemplateUrl] = useState<string | null>(null)
  const [fieldConfig, setFieldConfig] = useState<FieldConfig[]>([])
  const [certificateGenerated, setCertificateGenerated] = useState(false)

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        setLoading(true)
        
        if (!params.id) {
          setError("Invalid verification link")
          return
        }

        console.log("[Verification] Fetching certificate:", params.id)

        // Call our verification API
        const response = await fetch(`/api/certificates/verify/${params.id}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          setError(result.error || "Certificate not found or invalid")
          setCertificate(null)
          return
        }

        // Check if certificate is revoked
        if (result.revoked) {
          setError("This certificate has been revoked and is no longer valid")
          setCertificate({
            ...result.certificate,
            id: params.id as string,
            recipientEmail: "",
            certificateUrl: "",
            isValid: false,
            verificationCode: `CERT-${(params.id as string).substring(0, 8).toUpperCase()}`,
            issueDate: "",
          })
          return
        }

        // Set valid certificate data
        setCertificate({
          ...result.certificate,
          certificateUrl: "", // We don't store the image, just metadata
          isValid: true,
        })
        
        console.log("[Verification] Certificate verified successfully:", result.certificate)
        
        // NEW: If certificate has eventId, fetch Event to get template and field config
        if (result.certificate.eventId) {
          console.log("[Verification] Fetching event template:", result.certificate.eventId)
          try {
            const eventResponse = await fetch(`/api/events/${result.certificate.eventId}`)
            const eventData = await eventResponse.json()
            
            console.log("[Verification] Event response:", eventData)
            
            if (eventData.success && eventData.event) {
              console.log("[Verification] Event data:", {
                hasTemplateS3Key: !!eventData.event.templateS3Key,
                templateS3Key: eventData.event.templateS3Key,
                hasFieldConfig: !!eventData.event.fieldConfiguration,
                fieldConfigCount: eventData.event.fieldConfiguration?.length || 0
              })
              
              // Get signed URL for template
              if (eventData.event.templateS3Key) {
                console.log("[Verification] Requesting signed URL for key:", eventData.event.templateS3Key)
                const templateResponse = await fetch(
                  `/api/templates/signed-url?key=${encodeURIComponent(eventData.event.templateS3Key)}`
                )
                const templateData = await templateResponse.json()
                
                console.log("[Verification] Signed URL response:", templateData)
                
                if (templateData.success && templateData.signedUrl) {
                  console.log("[Verification] ✅ Got signed URL for template")
                  setTemplateUrl(templateData.signedUrl)
                  setFieldConfig(eventData.event.fieldConfiguration || [])
                } else {
                  console.warn("[Verification] ⚠️ Failed to get signed URL:", templateData.error)
                }
              } else {
                console.warn("[Verification] ⚠️ No templateS3Key in event data")
              }
            } else {
              console.warn("[Verification] ⚠️ Event API response not successful:", eventData)
            }
          } catch (err) {
            console.error("[Verification] ❌ Error fetching event template:", err)
          }
        } else {
          console.log("[Verification] No eventId in certificate, showing metadata only")
        }
        
      } catch (err) {
        console.error("[Verification] Error:", err)
        setError("Failed to verify certificate. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      verifyCertificate()
    }
  }, [params.id])

  // NEW: Render certificate on canvas when template is available
  useEffect(() => {
    if (!templateUrl || !certificate || !canvasRef.current) {
      console.log('[Verification] Waiting for data:', { templateUrl: !!templateUrl, certificate: !!certificate, canvas: !!canvasRef.current })
      return
    }

    const renderCertificate = async () => {
      console.log("[Verification] Rendering certificate on canvas...")
      console.log("[Verification] Template URL:", templateUrl)
      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.error("[Verification] ❌ Failed to get canvas context")
        return
      }

      try {
        // Load template image via proxy to avoid CORS
        const img = new window.Image()
        // Use proxy endpoint to bypass CORS issues
        const proxyUrl = `/api/templates/proxy?url=${encodeURIComponent(templateUrl)}`
        
        console.log("[Verification] Loading image via proxy...")
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            console.log("[Verification] ✅ Image loaded successfully:", {
              width: img.width,
              height: img.height
            })
            resolve(null)
          }
          img.onerror = (error) => {
            console.error("[Verification] ❌ Image load failed:", error)
            console.error("[Verification] Proxy URL:", proxyUrl)
            reject(new Error('Failed to load template image via proxy'))
          }
          img.src = proxyUrl
        })

        // Set canvas size to match template
        canvas.width = img.width
        canvas.height = img.height

        // Draw template
        ctx.drawImage(img, 0, 0)

        // Create mapping of recipient data with multiple aliases
        const recipientData: Record<string, string> = {
          // Direct mappings
          recipientName: certificate.recipientName,
          recipientEmail: certificate.recipientEmail,
          eventName: certificate.eventName,
          eventDate: certificate.eventDate,
          organizationName: certificate.organizationName,
          clubName: certificate.clubName,
          issueDate: new Date(certificate.issueDate).toLocaleDateString(),
          // Common aliases (case-insensitive)
          name: certificate.recipientName,
          Name: certificate.recipientName,
          email: certificate.recipientEmail,
          Email: certificate.recipientEmail,
          event: certificate.eventName,
          Event: certificate.eventName,
          date: certificate.eventDate,
          Date: certificate.eventDate,
          organization: certificate.organizationName,
          Organization: certificate.organizationName,
          club: certificate.clubName,
          Club: certificate.clubName,
        }

        console.log('[Verification] Field configuration:', fieldConfig)
        console.log('[Verification] Certificate data:', certificate)

        // Render each field with recipient data (if field config exists)
        if (fieldConfig && fieldConfig.length > 0) {
          fieldConfig.forEach((field) => {
            // Try exact match first, then case-insensitive search
            let value = recipientData[field.name]
            
            if (!value) {
              // Try to find case-insensitive match
              const matchingKey = Object.keys(recipientData).find(
                key => key.toLowerCase() === field.name.toLowerCase()
              )
              value = matchingKey ? recipientData[matchingKey] : field.name
            }
            
            console.log('[Verification] Rendering field:', { 
              fieldName: field.name, 
              value, 
              x: field.x, 
              y: field.y,
              alignment: field.alignment || field.align
            })
            
            // Match certificate generation rendering for consistent positioning
            const rawFontWeight = field.fontWeight === 400 ? undefined : field.fontWeight
            const fontString = rawFontWeight
              ? `${rawFontWeight} ${field.fontSize}px "${field.fontFamily}"`
              : `${field.fontSize}px "${field.fontFamily}"`

            ctx.font = fontString
            ctx.fillStyle = field.color

            const alignment = (field.alignment || field.align || 'left') as CanvasTextAlign
            ctx.textAlign = alignment

            // Adjust x position based on alignment (same as generation & MyCertificates)
            const x = alignment === 'center'
              ? field.x
              : alignment === 'right'
              ? field.x + (field.maxWidth || 0)
              : field.x

            if (field.maxWidth) {
              ctx.fillText(value, x, field.y, field.maxWidth)
            } else {
              ctx.fillText(value, x, field.y)
            }
          })
        } else {
          console.log('[Verification] No field configuration, showing template only')
        }

        setCertificateGenerated(true)
        console.log("[Verification] ✅ Certificate rendered successfully")
      } catch (err) {
        console.error("[Verification] ❌ Error rendering certificate:", err)
        console.error("[Verification] Error details:", err instanceof Error ? err.message : 'Unknown error')
        
        // Show error to user
        if (err instanceof Error && err.message.includes('CORS')) {
          toast.error('Cannot load certificate template. Please check S3 CORS configuration.')
        } else {
          toast.error('Failed to render certificate preview')
        }
      }
    }

    renderCertificate()
  }, [templateUrl, certificate, fieldConfig])

  const downloadCertificate = () => {
    if (!canvasRef.current || !certificateGenerated) {
      console.warn("[Verification] Canvas not ready for download")
      return
    }

    canvasRef.current.toBlob((blob) => {
      if (!blob) return
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `certificate-${certificate?.recipientName || 'verification'}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log("[Verification] ✅ Certificate downloaded")
    }, 'image/png')
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <Loader2 className="h-16 w-16 mx-auto mb-4 text-[#21808D] animate-spin" />
          <h2 className="text-2xl font-bold mb-2">Verifying Certificate</h2>
          <p className="text-gray-600">Please wait while we verify your certificate...</p>
        </Card>
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2 text-red-600">Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error || "Certificate not found or invalid."}</p>
          <Button 
            onClick={() => router.push("/")}
            className="bg-[#21808D] hover:bg-[#1a6570] text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back Home
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* Decorative Background Pattern */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            repeating-linear-gradient(22.5deg, transparent, transparent 2px, rgba(75, 85, 99, 0.06) 2px, rgba(75, 85, 99, 0.06) 3px, transparent 3px, transparent 8px),
            repeating-linear-gradient(67.5deg, transparent, transparent 2px, rgba(107, 114, 128, 0.05) 2px, rgba(107, 114, 128, 0.05) 3px, transparent 3px, transparent 8px)
          `,
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <Image 
              src="/c.svg" 
              alt="CertificateHash Logo" 
              width={40} 
              height={40}
              className="w-10 h-10"
            />
            <span className="font-bold text-xl hidden sm:inline">Forge</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto">
          {/* Verification Status Banner */}
          <Card className="bg-white p-6 md:p-8 rounded-2xl shadow-lg mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {certificate.isValid ? (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="h-10 w-10 text-red-600" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {certificate.isValid ? "Certificate Verified" : "Invalid Certificate"}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {certificate.isValid 
                      ? "This certificate is authentic and has been verified." 
                      : "This certificate could not be verified."}
                  </p>
                </div>
              </div>
              
              {certificate.isValid && (
                <Badge className="bg-green-100 text-green-700 text-lg px-4 py-2 hover:bg-green-100">
                  Verified
                </Badge>
              )}
            </div>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Certificate Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Certificate Preview */}
              <Card className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold mb-4">Certificate Preview</h2>
                <div className="bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                  {templateUrl ? (
                    <div className="relative">
                      <canvas
                        ref={canvasRef}
                        className="w-full h-auto"
                        style={{ display: certificateGenerated ? 'block' : 'none' }}
                      />
                      {!certificateGenerated && (
                        <div className="aspect-[1.414/1] flex items-center justify-center">
                          <div className="text-center p-8">
                            <Loader2 className="h-20 w-20 mx-auto mb-4 text-[#21808D] animate-spin" />
                            <p className="text-gray-500 mb-4">Rendering certificate...</p>
                            <p className="text-sm text-gray-400">Please wait...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-[1.414/1] flex items-center justify-center">
                      <div className="text-center p-8">
                        <Award className="h-20 w-20 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500 mb-4">Certificate preview not available</p>
                        <p className="text-sm text-gray-400">
                          {certificate?.eventId 
                            ? 'Loading template from storage...' 
                            : 'This certificate was generated with an older version'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-4">
                  <Button 
                    className="flex-1 bg-[#21808D] hover:bg-[#1a6570] text-white"
                    onClick={downloadCertificate}
                    disabled={!certificateGenerated}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Certificate
                  </Button>
                  <Button variant="outline" className="flex-1 border-[#21808D] text-[#21808D] hover:bg-[#21808D] hover:text-white">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </Card>

              {/* Event Details */}
              <Card className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold mb-4">Event Details</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-[#21808D] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500">Event Name</p>
                      <p className="font-semibold text-gray-900">{certificate.eventName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-[#21808D] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500">Event Date</p>
                      <p className="font-semibold text-gray-900">{certificate.eventDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-[#21808D] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500">Organization</p>
                      <p className="font-semibold text-gray-900">{certificate.organizationName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-[#21808D] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500">Issued By</p>
                      <p className="font-semibold text-gray-900">{certificate.clubName}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recipient Information */}
            <div className="space-y-6">
              <Card className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold mb-4">Recipient Information</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Name</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[#21808D]" />
                      <p className="font-semibold">{certificate.recipientName}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="text-sm text-gray-700 break-all">{certificate.recipientEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Issue Date</p>
                    <p className="font-semibold">{certificate.issueDate}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold mb-4">Verification Details</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Certificate ID</p>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                      {certificate.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Verification Code</p>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                      {certificate.verificationCode}
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      This certificate has been digitally verified and is authentic.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-5xl mx-auto mt-8 text-center">
          <p className="text-sm text-gray-500">
            Powered by <span className="font-semibold text-[#21808D]">Forge</span> • 
            Certificate Generation Platform
          </p>
        </div>
      </div>
    </div>
  )
}
