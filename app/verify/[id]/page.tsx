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
import { renderWatermark } from "@/lib/watermark-utils"
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
  Mail,
  Lock,
  Copy,
  Check,
  Maximize2,
  X,
  ShieldCheck
} from "lucide-react"
import { TbBuildingBank } from "react-icons/tb"

function formatDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return "—"
  try {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return String(dateInput)
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d)
  } catch {
    return String(dateInput)
  }
}

function maskEmail(email: string | undefined): string {
  if (!email || !email.includes("@")) return email || "—"
  const [local, domain] = email.split("@")
  if (local.length <= 4) {
    return `${local[0]}••••@${domain}`
  }
  return `${local.slice(0, 2)}••••••${local.slice(-2)}@${domain}`
}
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
  resolvedFieldValues?: Record<string, string>
  watermarkEnabledAtIssue?: boolean
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
  const [copiedId, setCopiedId] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  const handleCopy = (text: string, type: "id" | "code") => {
    if (!text) return
    navigator.clipboard.writeText(text)
    if (type === "id") {
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    } else {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
    toast.success("Copied to clipboard")
  }

  const openLightbox = () => {
    if (canvasRef.current && certificateGenerated) {
      setLightboxImg(canvasRef.current.toDataURL("image/png"))
      setLightboxOpen(true)
    }
  }

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
          ...(certificate.resolvedFieldValues || {}),
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
            // Prefer field id first so duplicate field names (e.g. two "Custom" fields)
            // still resolve to distinct values captured at issuance.
            let value =
              recipientData[field.id] ||
              recipientData[field.name]

            if (!value) {
              // Try to find case-insensitive match
              const matchingKey = Object.keys(recipientData).find(
                key => key.toLowerCase() === field.name.toLowerCase()
              )
              value = matchingKey ? recipientData[matchingKey] : field.name
            }

            // Legacy fallback for old certificates with no stored field snapshots
            if (!value || value === field.name) {
              const lowerName = field.name.toLowerCase()
              if (lowerName === 'name') value = certificate.recipientName
              else if (lowerName === 'date') value = certificate.eventDate || new Date(certificate.issueDate).toLocaleDateString()
              else if (lowerName === 'course' || lowerName === 'event') value = certificate.eventName
              else value = ''
            }

            if (!value) {
              return
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

        // Immutable rule: use stored issuance state, never recalculate from current settings.
        if (certificate.watermarkEnabledAtIssue !== false) {
          renderWatermark(ctx, canvas.width, canvas.height, 1)
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
      <div className="min-h-screen w-full bg-[#FAFAFA] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-3">
          <Loader2 className="h-9 w-9 mx-auto text-[#21808D] animate-spin" />
          <h2 className="text-xl font-semibold text-slate-900">Verifying certificate</h2>
          <p className="text-sm text-slate-500">Checking cryptographic integrity against Senement registry...</p>
        </div>
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen w-full bg-[#FAFAFA] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <XCircle className="h-12 w-12 mx-auto text-red-500" />
          <h2 className="text-2xl font-semibold text-slate-900">Verification failed</h2>
          <p className="text-sm text-slate-600">{error || "Certificate not found or invalid."}</p>
          <Button
            onClick={() => router.push("/")}
            className="bg-[#21808D] hover:bg-[#1a6570] text-white text-xs font-semibold px-4 py-2 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Button>
        </div>
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
        <meta property="og:description" content={`${certificate.recipientName} has earned a certificate for ${certificate.eventName}, issued by ${certificate.organizationName} on ${formatDate(certificate.issueDate)}`} />
        <meta property="og:image" content={certificate.certificateUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/api/certificates/${certificate.id}/image`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Certificate: ${certificate.eventName}`} />
        <meta name="twitter:description" content={`${certificate.recipientName} earned this certificate from ${certificate.organizationName}`} />
        <meta name="twitter:image" content={certificate.certificateUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/api/certificates/${certificate.id}/image`} />

        {/* LinkedIn specific */}
        <meta property="og:site_name" content="Certiflo Certificate Platform" />
      </Head>

      <div
        className="min-h-screen w-full bg-[#FAFAFA] text-slate-900 relative"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
        }}
        onContextMenu={(e) => e.preventDefault()} // Disable right-click
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
          {/* Top navigation row */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/70">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-slate-600 hover:text-slate-900 -ml-2 text-xs md:text-sm h-8"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to home
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Powered by</span>
              <span className="font-semibold text-slate-900 tracking-tight">Senement</span>
            </div>
          </div>

          {/* Verification Verdict Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <Lock className="h-6 w-6 text-emerald-600 shrink-0" />
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
                  {certificate.isValid ? 'This certificate is authentic.' : 'This certificate is not valid.'}
                </h1>
              </div>
              <p className="text-sm text-slate-500 max-w-xl">
                {certificate.isValid
                  ? 'Cryptographically verified against Senement’s record registry • Checked just now.'
                  : 'The provided verification link or code did not match any active certificate in our system.'}
              </p>
            </div>

            {certificate.isValid && (
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SHA-256 Tamper-Proof
                </span>
              </div>
            )}
          </div>

          {/* Main 2-column layout */}
          <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-start">
            {/* Left Column: Certificate Preview & Actions */}
            <div className="space-y-4">
              <div
                onClick={openLightbox}
                className={`relative rounded-xl border border-slate-200/90 bg-white shadow-xs overflow-hidden transition-all ${
                  certificateGenerated ? 'cursor-zoom-in group hover:border-slate-300' : ''
                }`}
                title={certificateGenerated ? "Click to view full size" : undefined}
              >
                {templateUrl ? (
                  <div className="flex items-center justify-center p-2 sm:p-4 bg-white">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-auto max-h-[480px] object-contain transition-transform duration-200 group-hover:scale-[1.008]"
                      style={{ display: certificateGenerated ? 'block' : 'none' }}
                    />
                    {!certificateGenerated && (
                      <div className="h-64 sm:h-80 w-full bg-slate-50 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2.5">
                          <div className="w-7 h-7 border-2 border-[#21808D] border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-slate-500 font-medium">Rendering certificate...</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-64 sm:h-80 bg-slate-100 flex items-center justify-center">
                    <Award className="w-16 h-16 text-slate-300" />
                  </div>
                )}

                {/* Hover indicator for zoom */}
                {certificateGenerated && (
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 text-white text-[11px] font-medium px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1.5 pointer-events-none shadow-sm">
                    <Maximize2 className="w-3 h-3" />
                    Click to zoom
                  </div>
                )}
              </div>

              {/* Action / Claim bar */}
              {isAuthenticated ? (
                <div className="space-y-4 pt-2">
                  {/* Format Selector & Download */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-full sm:w-auto">
                      <button
                        onClick={() => setDownloadFormat('png')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          downloadFormat === 'png'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        PNG
                      </button>
                      <button
                        onClick={() => setDownloadFormat('pdf')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          downloadFormat === 'pdf'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        PDF
                      </button>
                    </div>

                    <Button
                      className="w-full sm:w-auto flex-1 bg-[#21808D] hover:bg-[#1a6570] text-white text-xs font-semibold h-9"
                      onClick={downloadCertificate}
                      disabled={!certificateGenerated}
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />
                      Download {downloadFormat.toUpperCase()}
                    </Button>
                  </div>

                  {/* Social share row */}
                  <div className="pt-3 border-t border-slate-200/80">
                    <p className="text-xs font-medium text-slate-500 mb-2.5">Share achievement</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8 border-slate-200"
                        onClick={() => {
                          const verificationUrl = window.location.href
                          const issueDate = new Date(certificate.issueDate)
                          const addToProfileUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(certificate.eventName)}&organizationName=${encodeURIComponent(certificate.organizationName)}&issueYear=${issueDate.getFullYear()}&issueMonth=${issueDate.getMonth() + 1}&certUrl=${encodeURIComponent(verificationUrl)}&certId=${certificate.id}`
                          window.open(addToProfileUrl, '_blank')
                          toast.success('Opening LinkedIn')
                        }}
                      >
                        <Linkedin className="w-3.5 h-3.5 mr-1.5 text-[#0A66C2]" />
                        LinkedIn
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8 border-slate-200"
                        onClick={() => {
                          const verificationUrl = window.location.href
                          const text = `I've earned a certificate for ${certificate.eventName}! Check it out:`
                          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(verificationUrl)}`
                          window.open(twitterUrl, '_blank', 'width=600,height=600')
                          toast.success('Opening Twitter')
                        }}
                      >
                        <Share2 className="w-3.5 h-3.5 mr-1.5 text-slate-700" />
                        Twitter
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8 border-slate-200"
                        onClick={() => {
                          const verificationUrl = window.location.href
                          const text = `I've earned a certificate for ${certificate.eventName}! ${verificationUrl}`
                          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
                          window.open(whatsappUrl, '_blank')
                          toast.success('Opening WhatsApp')
                        }}
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                        WhatsApp
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8 border-slate-200"
                        onClick={() => {
                          const verificationUrl = window.location.href
                          const subject = `Certificate: ${certificate.eventName}`
                          const body = `I'm excited to share that I've earned a certificate for ${certificate.eventName}!\n\nYou can verify it here: ${verificationUrl}`
                          const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                          window.location.href = mailtoUrl
                          toast.success('Opening email client')
                        }}
                      >
                        <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                        Email
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200/90 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Are you {certificate.recipientName}?
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sign in to download your high-resolution copy and add it to your LinkedIn profile.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      sessionStorage.setItem('returnToVerification', window.location.pathname)
                      router.push('/login')
                    }}
                    className="bg-[#21808D] hover:bg-[#1a6570] text-white text-xs font-semibold px-4 py-2 shrink-0 rounded-lg shadow-xs"
                  >
                    <LogIn className="h-3.5 w-3.5 mr-1.5" />
                    Sign in to claim
                  </Button>
                </div>
              )}
            </div>

            {/* Right Column: Clean Credential Manifest (No Boxy Cards) */}
            <div className="space-y-6 pt-1">
              {/* Recipient & Issuer */}
              <div>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3.5">
                  Recipient & Issuer
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500">Recipient Name</span>
                    <p className="font-semibold text-slate-900 text-base mt-0.5">{certificate.recipientName}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Email Address</span>
                    <p className="text-slate-800 text-sm mt-0.5 font-mono">{maskEmail(certificate.recipientEmail)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Issued By</span>
                    <p className="text-slate-800 text-sm mt-0.5 flex items-center gap-1.5 font-medium">
                      <TbBuildingBank className="h-4 w-4 text-slate-400" />
                      {certificate.organizationName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200/80" />

              {/* Event Information */}
              <div>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3.5">
                  Event Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500">Event</span>
                    <p className="font-medium text-slate-900 text-sm mt-0.5">{certificate.eventName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-500">Event Date</span>
                      <p className="text-slate-700 text-sm mt-0.5">{formatDate(certificate.eventDate)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Issued On</span>
                      <p className="text-slate-700 text-sm mt-0.5">{formatDate(certificate.issueDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200/80" />

              {/* Verification Details */}
              <div>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Verification Record
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Certificate ID</label>
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2">
                      <span className="font-mono text-xs md:text-sm text-slate-800 break-all select-all">
                        {certificate.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(certificate.id, 'id')}
                        className="ml-2 text-slate-400 hover:text-slate-700 transition-colors p-1 rounded"
                        title="Copy Certificate ID"
                      >
                        {copiedId ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Verification Code</label>
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2">
                      <span className="font-mono text-xs md:text-sm text-slate-800 break-all select-all">
                        {certificate.verificationCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(certificate.verificationCode, 'code')}
                        className="ml-2 text-slate-400 hover:text-slate-700 transition-colors p-1 rounded"
                        title="Copy Verification Code"
                      >
                        {copiedCode ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed pt-1">
                    This certificate is cryptographically verified against a tamper-evident record stored by Senement. Any discrepancy between this verification registry and a distributed document is invalid.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-slate-200/70 text-center text-xs text-slate-400">
            <p>
              Powered by <span className="font-semibold text-slate-700">Senement</span> • Credential Infrastructure & Verification
            </p>
          </div>
        </div>

        {/* Lightbox Modal */}
        {lightboxOpen && lightboxImg && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-150"
            onClick={() => setLightboxOpen(false)}
          >
            <div
              className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between text-white/90 mb-3 px-1">
                <span className="text-xs md:text-sm font-medium truncate">
                  {certificate.eventName} — {certificate.recipientName}
                </span>
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close fullscreen"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <img
                src={lightboxImg}
                alt={`Certificate awarded to ${certificate.recipientName}`}
                className="w-full h-auto max-h-[82vh] object-contain rounded-lg shadow-2xl bg-white"
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
