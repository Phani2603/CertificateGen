"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Head from "next/head"
import jsPDF from "jspdf"
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
  Loader2,
  LogIn,
  Linkedin,
  Send,
  Mail
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
  eventId?: string // MongoDB ObjectId reference
  templateS3Key?: string
  fieldConfiguration?: FieldConfig[]
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
  const { data: session, status } = useSession()
  const [certificate, setCertificate] = useState<CertificateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [templateUrl, setTemplateUrl] = useState<string | null>(null)
  const [fieldConfig, setFieldConfig] = useState<FieldConfig[]>([])
  const [certificateGenerated, setCertificateGenerated] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<"png" | "pdf">("png")
  const isAuthenticated = status === "authenticated"

  // Store current URL in sessionStorage when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && params.id) {
      sessionStorage.setItem('returnToVerification', window.location.pathname)
    }
    // Clear on unmount
    return () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('returnToVerification')
      }
    }
  }, [params.id])

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        setLoading(true)
        setTemplateUrl(null)
        setFieldConfig([])
        setCertificateGenerated(false)
        
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
        
        // Determine template and field configuration, preferring certificate snapshot first
        let templateKey: string | undefined = result.certificate.templateS3Key
        let effectiveFieldConfig: FieldConfig[] | undefined = result.certificate.fieldConfiguration as FieldConfig[] | undefined

        // If missing on certificate, try to fetch from related event
        if (result.certificate.eventId && (!templateKey || !effectiveFieldConfig?.length)) {
          console.log("[Verification] Fetching event for template/fields:", result.certificate.eventId)
          try {
            const eventResponse = await fetch(`/api/events/${result.certificate.eventId}`)
            const eventData = await eventResponse.json()

            console.log("[Verification] Event response:", eventData)

            if (eventData.success && eventData.event) {
              console.log("[Verification] Event data:", {
                hasTemplateS3Key: !!eventData.event.templateS3Key,
                templateS3Key: eventData.event.templateS3Key,
                hasFieldConfig: !!eventData.event.fieldConfiguration,
                fieldConfigCount: eventData.event.fieldConfiguration?.length || 0,
              })

              if (!templateKey && eventData.event.templateS3Key) {
                templateKey = eventData.event.templateS3Key
              }

              if ((!effectiveFieldConfig || !effectiveFieldConfig.length) && eventData.event.fieldConfiguration) {
                effectiveFieldConfig = eventData.event.fieldConfiguration as FieldConfig[]
              }
            } else {
              console.warn("[Verification] ⚠️ Event API response not successful:", eventData)
            }
          } catch (err) {
            console.error("[Verification] ❌ Error fetching event template:", err)
          }
        } else if (!result.certificate.eventId) {
          console.log("[Verification] No eventId in certificate, using certificate metadata only")
        }

        if (templateKey) {
          try {
            console.log("[Verification] Requesting signed URL for key:", templateKey)
            const templateResponse = await fetch(
              `/api/templates/signed-url?key=${encodeURIComponent(templateKey)}`
            )
            const templateData = await templateResponse.json()

            console.log("[Verification] Signed URL response:", templateData)

            if (templateData.success && templateData.signedUrl) {
              console.log("[Verification] ✅ Got signed URL for template")
              setTemplateUrl(templateData.signedUrl)
              setFieldConfig(effectiveFieldConfig || [])
            } else {
              console.warn("[Verification] ⚠️ Failed to get signed URL:", templateData.error)
            }
          } catch (err) {
            console.error("[Verification] ❌ Error getting template signed URL:", err)
          }
        } else {
          console.log("[Verification] No template key found for this certificate")
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
          date: new Date(certificate.issueDate).toLocaleDateString(),
          Date: new Date(certificate.issueDate).toLocaleDateString(),
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

  const downloadCertificate = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to download certificates')
      // Store current URL before redirecting
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('returnToVerification', window.location.pathname)
      }
      router.push('/login')
      return
    }

    if (!canvasRef.current || !certificateGenerated) {
      console.warn("[Verification] Canvas not ready for download")
      toast.error("Certificate is still loading, please wait...")
      return
    }

    const fileName = `certificate-${certificate?.recipientName || 'verification'}`
    const canvas = canvasRef.current

    if (downloadFormat === 'pdf') {
      try {
        // Ensure canvas is fully rendered
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Validate canvas has content
        if (!canvas.width || !canvas.height) {
          throw new Error('Canvas has no dimensions')
        }
        
        // Get image data directly from original canvas (avoid CORS issues)
        const imgData = canvas.toDataURL('image/jpeg', 0.95)
        
        // Validate image data
        if (!imgData || imgData === 'data:,' || imgData.length < 100) {
          throw new Error('Failed to generate image data from canvas')
        }
        
        console.log('[PDF] Canvas dimensions:', canvas.width, 'x', canvas.height)
        console.log('[PDF] Image data length:', imgData.length)
        
        // Calculate dimensions
        const canvasWidth = canvas.width
        const canvasHeight = canvas.height
        const aspectRatio = canvasWidth / canvasHeight
        
        console.log('[PDF] Aspect ratio:', aspectRatio)
        
        // Determine orientation (most certificates are landscape)
        const isLandscape = aspectRatio > 1
        
        // Create PDF with proper settings
        const pdf = new jsPDF({
          orientation: isLandscape ? 'l' : 'p',
          unit: 'mm',
          format: 'a4'
        })
        
        // Get page dimensions
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        
        console.log('[PDF] Page dimensions:', pageWidth, 'x', pageHeight)
        
        // Calculate image dimensions with margins
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
        
        console.log('[PDF] Image position:', x, y, 'Size:', imgWidth, 'x', imgHeight)
        
        // Add image to PDF
        pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight)
        
        // Add verification link at bottom of page
        const verificationUrl = `${window.location.origin}/verify/${certificate?.id}`
        
        pdf.setFontSize(10)
        pdf.setTextColor(100, 100, 100)
        
        // Add "Verify this certificate" text
        const bottomY = pageHeight - 5
        pdf.text('Verify this certificate:', margin, bottomY)
        
        // Add clickable verification link
        pdf.setTextColor(33, 128, 141) // Teal color
        const linkX = margin + 45
        pdf.textWithLink(verificationUrl, linkX, bottomY, { url: verificationUrl })
        
        // 🔑 CORRECT: Use arraybuffer (most reliable method)
        const pdfArrayBuffer = pdf.output('arraybuffer')
        
        // Validate PDF was generated
        if (!pdfArrayBuffer || pdfArrayBuffer.byteLength < 1000) {
          throw new Error('Generated PDF is too small or invalid')
        }
        
        console.log('[PDF] PDF size:', pdfArrayBuffer.byteLength, 'bytes')
        
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
        
        console.log("[Verification] ✅ Certificate downloaded as PDF")
        toast.success("Certificate downloaded as PDF")
      } catch (error) {
        console.error('[Verification] PDF generation failed:', error)
        toast.error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } else {
      // PNG download
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Failed to generate PNG")
          return
        }
        
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${fileName}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        console.log("[Verification] ✅ Certificate downloaded as PNG")
        toast.success("Certificate downloaded as PNG")
      }, 'image/png')
    }
  }

  const handleShare = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to share certificates')
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('returnToVerification', window.location.pathname)
      }
      router.push('/login')
      return
    }
    // Share functionality
    const shareUrl = window.location.href
    navigator.clipboard.writeText(shareUrl)
    toast.success('Verification link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 flex items-center justify-center p-4">
        <Card className="bg-white border border-slate-200 shadow-xl p-8 rounded-3xl max-w-md w-full text-center">
          <Loader2 className="h-16 w-16 mx-auto mb-4 text-[#21808D] animate-spin" />
          <h2 className="text-2xl font-bold mb-2 text-slate-900">Verifying certificate</h2>
          <p className="text-slate-500">Please wait while we verify your certificate...</p>
        </Card>
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen w-full bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 flex items-center justify-center p-4">
        <Card className="bg-white border border-red-100 shadow-xl p-8 rounded-3xl max-w-md w-full text-center">
          <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2 text-red-600">Verification failed</h2>
          <p className="text-slate-600 mb-6">{error || "Certificate not found or invalid."}</p>
          <Button 
            onClick={() => router.push("/")}
            className="bg-[#21808D] hover:bg-[#1a6570] text-white font-semibold"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go back home
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <>
      <Head>
        <meta name="screenshot" content="disabled" />
        <meta name="screen-capture" content="disabled" />
        
        {/* Open Graph meta tags for rich LinkedIn/social sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:title" content={`Certificate: ${certificate.eventName} - ${certificate.recipientName}`} />
        <meta property="og:description" content={`${certificate.recipientName} has earned a certificate for ${certificate.eventName}, issued by ${certificate.organizationName} on ${certificate.issueDate}`} />
        <meta property="og:image" content={certificate.certificateUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/api/certificates/${certificate.id}/image`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Certificate: ${certificate.eventName}`} />
        <meta name="twitter:description" content={`${certificate.recipientName} earned this certificate from ${certificate.organizationName}`} />
        <meta name="twitter:image" content={certificate.certificateUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/api/certificates/${certificate.id}/image`} />
        
        {/* LinkedIn specific */}
        <meta property="og:site_name" content="Forge Certificate Platform" />
      </Head>
      <div className="min-h-screen w-full bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 relative overflow-hidden"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
        }}
        onContextMenu={(e) => e.preventDefault()} // Disable right-click
      >
      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-20 -left-24 h-72 w-72 rounded-full bg-[#8FD6BD]/25 blur-3xl" />
        <div className="absolute bottom-0 -right-24 h-80 w-80 rounded-full bg-[#21808D]/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.12),transparent_55%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-10">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/")}
            className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 px-3 md:px-4 rounded-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-md">
              <Image 
                src="/cflo1.png" 
                alt="Forge" 
                width={24} 
                height={24}
                className="w-5 h-5"
              />
            </div>
            <div className="flex flex-col items-end">
              <span className="font-semibold text-sm text-slate-900 tracking-tight">Forge</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Certificate verification</span>
            </div>
          </div>
        </div>

        {/* Main verification card */}
        <div className="relative">
          <div className="absolute -inset-px rounded-[28px] bg-[conic-gradient(from_130deg_at_50%_0%,rgba(143,214,189,0.55),rgba(33,128,141,0.15),rgba(148,163,184,0.25),rgba(143,214,189,0.6))] opacity-60 blur-sm" />

          <div className="relative rounded-[26px] bg-white border border-slate-200 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl p-5 md:p-8 lg:p-10">
            {/* Status row */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl border ${
                  certificate.isValid
                    ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-300'
                    : 'border-red-400/50 bg-red-500/10 text-red-300'
                }`}>
                  {certificate.isValid ? (
                    <CheckCircle2 className="h-7 w-7" />
                  ) : (
                    <XCircle className="h-7 w-7" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 mb-1">
                    {certificate.isValid ? 'Verified certificate' : 'Verification error'}
                  </p>
                  <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
                    {certificate.isValid ? 'This certificate is authentic.' : 'This certificate is not valid.'}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500 max-w-xl">
                    {certificate.isValid 
                      ? 'The details shown below are fetched directly from the issuer and can be used for audits, hiring, or academic verification.' 
                      : 'The provided verification link or code did not match any active certificate in our system.'}
                  </p>
                </div>
              </div>

              {certificate.isValid && (
                <div className="flex items-center gap-3 self-start md:self-auto">
                  <Badge className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-xs md:text-sm font-medium">
                    Verified & live on-chain
                  </Badge>
                </div>
              )}
            </div>

            {/* Content grid: preview + details */}
            <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
              {/* Left: certificate preview */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Certificate Preview</p>
                  <p className="text-xs text-gray-400 mt-0.5">{certificate.eventName}</p>
                </div>

                <div className="mb-6 rounded-lg sm:rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                  {templateUrl ? (
                    <div className="flex items-center justify-center bg-white p-3 sm:p-4 lg:p-6">
                      <canvas
                        ref={canvasRef}
                        className="w-full h-auto max-h-72 sm:max-h-96"
                        style={{ display: certificateGenerated ? 'block' : 'none' }}
                      />
                      {!certificateGenerated && (
                        <div className="h-48 sm:h-72 lg:h-96 bg-gray-100 flex items-center justify-center">
                          <div className="flex flex-col items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 border-3 border-[#21808D] border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs sm:text-sm text-gray-600 font-medium">Rendering certificate...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 sm:h-72 lg:h-96 bg-linear-to-br from-[#21808D] to-[#8FD6BD] flex items-center justify-center">
                      <Award className="w-16 sm:w-20 lg:w-24 h-16 sm:h-20 lg:h-24 text-white/60" />
                    </div>
                  )}
                </div>

                {isAuthenticated ? (
                  <div className="space-y-3">
                    {/* Format Selector */}
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-full sm:w-auto">
                      <button
                        onClick={() => setDownloadFormat('png')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          downloadFormat === 'png'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        PNG
                      </button>
                      <button
                        onClick={() => setDownloadFormat('pdf')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          downloadFormat === 'pdf'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        PDF
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        className="flex-1 bg-[#21808D] hover:bg-[#1a6570] text-white font-semibold"
                        onClick={downloadCertificate}
                        disabled={!certificateGenerated}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download as {downloadFormat.toUpperCase()}
                      </Button>
                    </div>
                    
                    {/* Social Sharing Section */}
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Share Your Achievement</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            const verificationUrl = window.location.href
                            
                            // LinkedIn "Add Certification" deep link - goes directly to Add License/Certification form
                            // This pre-fills all the certificate details in LinkedIn's profile form
                            const issueDate = new Date(certificate.issueDate)
                            const addToProfileUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(certificate.eventName)}&organizationName=${encodeURIComponent(certificate.organizationName)}&issueYear=${issueDate.getFullYear()}&issueMonth=${issueDate.getMonth() + 1}&certUrl=${encodeURIComponent(verificationUrl)}&certId=${certificate.id}`
                            
                            // Open LinkedIn Add Certification form
                            window.open(addToProfileUrl, '_blank')
                            
                            toast.success('Opening LinkedIn - Add to your profile!')
                          }}
                        >
                          <Linkedin className="w-3 h-3 mr-1.5" />
                          Add to LinkedIn
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            const verificationUrl = window.location.href
                            const text = `I've earned a certificate for ${certificate.eventName}! Check it out:`
                            
                            // Twitter/X share URL
                            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(verificationUrl)}`
                            window.open(twitterUrl, '_blank', 'width=600,height=600')
                            toast.success('Opening Twitter/X share')
                          }}
                        >
                          <Share2 className="w-3 h-3 mr-1.5" />
                          Twitter
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            const verificationUrl = window.location.href
                            const text = `I've earned a certificate for ${certificate.eventName}! ${verificationUrl}`
                            
                            // WhatsApp share URL
                            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
                            window.open(whatsappUrl, '_blank')
                            toast.success('Opening WhatsApp')
                          }}
                        >
                          <Send className="w-3 h-3 mr-1.5" />
                          WhatsApp
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            const verificationUrl = window.location.href
                            const subject = `Certificate: ${certificate.eventName}`
                            const body = `I'm excited to share that I've earned a certificate for ${certificate.eventName}!\n\nYou can verify it here: ${verificationUrl}`
                            
                            // Email mailto link
                            const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                            window.location.href = mailtoUrl
                            toast.success('Opening email client')
                          }}
                        >
                          <Mail className="w-3 h-3 mr-1.5" />
                          Email
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Sign in prompt for non-authenticated users */}
                    <div className="bg-gradient-to-br from-[#21808D]/10 to-[#8FD6BD]/10 border-2 border-[#21808D]/20 rounded-xl p-6 text-center">
                      <LogIn className="h-10 w-10 mx-auto mb-3 text-[#21808D]" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign in to download & share</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Create a free account to download certificates and share your achievements on social media.
                      </p>
                      <Button 
                        onClick={() => {
                          sessionStorage.setItem('returnToVerification', window.location.pathname)
                          router.push('/login')
                        }}
                        className="bg-[#21808D] hover:bg-[#1a6570] text-white font-semibold"
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign in to continue
                      </Button>
                    </div>
                  </div>
                )}

              </div>

              {/* Right: structured details */}
              <div className="space-y-4">
                {/* Recipient & event */}
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <div className="p-4 md:p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1">Recipient</p>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-[#21808D]" />
                          <p className="font-medium text-slate-900 text-sm md:text-base">{certificate.recipientName}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-700 border border-slate-200">
                        Issued • {certificate.issueDate}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-3 mt-1 text-sm">
                      <div className="space-y-1">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-[0.16em]">Email</p>
                        <p className="text-slate-800 text-xs md:text-sm break-all">{certificate.recipientEmail}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-[0.16em]">Organization</p>
                        <p className="text-slate-800 text-xs md:text-sm flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {certificate.organizationName}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-[0.16em]">Issued by</p>
                        <p className="text-slate-800 text-xs md:text-sm flex items-center gap-2">
                          <Award className="h-3.5 w-3.5 text-slate-400" />
                          {certificate.clubName}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Event details */}
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <div className="p-4 md:p-5 space-y-3 text-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1">Event</p>
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-[#8FD6BD] mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900 text-sm md:text-base">{certificate.eventName}</p>
                        <p className="text-xs md:text-sm text-slate-500">Event date: {certificate.eventDate}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Verification payload */}
                <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
                  <div className="p-4 md:p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1">Verification payload</p>
                        <p className="text-xs text-slate-500">Use these values in hiring portals or academic systems.</p>
                      </div>
                    </div>

                    <div className="mt-2 space-y-2 text-xs md:text-[13px]">
                      <div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-[0.18em] mb-1">Certificate ID</p>
                        <p className="font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 break-all">
                          {certificate.id}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-[0.18em] mb-1">Verification code</p>
                        <p className="font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 break-all">
                          {certificate.verificationCode}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 mt-1 border-t border-slate-200">
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        This certificate is verified against a tamper-evident record maintained by the issuing organization. 
                        Any mismatch between this page and a shared PDF/image should be treated as suspicious.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-[11px] md:text-xs text-slate-500">
          <p>
            Powered by <span className="font-semibold text-slate-900">Forge</span> • Certificate generation & verification platform
          </p>
        </div>
      </div>
    </div>
    </>
  )
}
