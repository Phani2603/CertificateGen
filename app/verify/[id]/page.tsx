"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
}

export default function VerificationPage() {
  const params = useParams()
  const router = useRouter()
  const [certificate, setCertificate] = useState<CertificateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        
        console.log("[Verification] Certificate verified successfully")
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
                <div className="bg-gray-100 rounded-lg aspect-[1.414/1] flex items-center justify-center border-2 border-gray-200">
                  <div className="text-center p-8">
                    <Award className="h-20 w-20 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 mb-4">Certificate preview would appear here</p>
                    <p className="text-sm text-gray-400">In production, this would show the actual certificate image</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button className="flex-1 bg-[#21808D] hover:bg-[#1a6570] text-white">
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
