"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, Search, CheckCircle, FileText, ArrowRight } from "lucide-react"

export default function VerifyLandingPage() {
  const router = useRouter()
  const [verificationId, setVerificationId] = useState("")
  const [error, setError] = useState("")

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!verificationId.trim()) {
      setError("Please enter a verification ID")
      return
    }

    // Navigate to the verification page
    router.push(`/verify/${verificationId.trim()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#21808D]/10 via-white to-[#8FD6BD]/10 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-[#21808D] rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Verify Certificate
          </h1>
          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            Enter the unique verification ID to check the authenticity and details of any certificate
          </p>
        </div>

        {/* Verification Form */}
        <Card className="p-8 shadow-xl">
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label htmlFor="verificationId" className="block text-sm font-medium text-gray-700 mb-2">
                Verification ID
              </label>
              <Input
                id="verificationId"
                type="text"
                placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                value={verificationId}
                onChange={(e) => {
                  setVerificationId(e.target.value)
                  setError("")
                }}
                className="text-base"
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                The verification ID can be found on your certificate or in the email you received
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#21808D] hover:bg-[#1a6570] text-white text-base py-6"
            >
              <Search className="w-5 h-5 mr-2" />
              Verify Certificate
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 text-center bg-white/80 backdrop-blur">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Instant Verification</h3>
            <p className="text-sm text-gray-600">
              Get immediate confirmation of certificate authenticity
            </p>
          </Card>

          <Card className="p-6 text-center bg-white/80 backdrop-blur">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Secure & Tamper-Proof</h3>
            <p className="text-sm text-gray-600">
              Protected with SHA-256 hash verification
            </p>
          </Card>

          <Card className="p-6 text-center bg-white/80 backdrop-blur">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Complete Details</h3>
            <p className="text-sm text-gray-600">
              View all certificate information and metadata
            </p>
          </Card>
        </div>

        {/* Info */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-900 mb-1">Where to find your Verification ID?</p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Check the email you received with your certificate</li>
                <li>Look for the verification ID on your certificate document</li>
                <li>Contact the organization that issued your certificate</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Back Button */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
