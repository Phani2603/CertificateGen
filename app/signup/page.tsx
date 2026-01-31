"use client"

import { Suspense, useState, FormEvent, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Building2, User } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const inviteToken = searchParams.get('invite')

  // Redirect authenticated users with invite to the accept page
  useEffect(() => {
    if (status === "authenticated" && inviteToken) {
      router.replace(`/invitations/accept?token=${encodeURIComponent(inviteToken)}`)
    }
  }, [status, inviteToken, router])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    userType: "" as "corporate" | "individual" | "",
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          inviteToken // Pass invite token
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account')
        return
      }

      // Auto-login after signup
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Account created but login failed")
      } else {
        // Redirect to login page which will route based on userType
        router.push("/login")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-[#f6f6f6] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding */}
        <div className="hidden md:block">
          <Link href="/landing" className="inline-flex items-center gap-2 mb-8 text-gray-600 hover:text-[#21808D] transition">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <h1 className="text-6xl font-black mb-6 leading-tight">
            START YOUR
            <br />
            <span className="text-[#21808D]">JOURNEY</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Join organizations worldwide and start creating verified certificates in minutes.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#FF5733] text-white p-6 rounded-2xl">
              <div className="text-3xl font-black mb-1">1000+</div>
              <div className="text-sm">Certificates</div>
            </div>
            <div className="bg-[#8FD6BD] text-black p-6 rounded-2xl">
              <div className="text-3xl font-black mb-1">200+</div>
              <div className="text-sm">Organizations</div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <Card className="bg-white p-8 md:p-12 shadow-xl">
          <div className="flex items-center gap-2 mb-8">
            <Image src="/cflo1.svg" alt="CertificateHash Logo" width={52} height={52} />
          </div>

          <h2 className="text-3xl font-bold mb-2">Create account</h2>
          <p className="text-gray-600 mb-8">
            Already have an account?{" "}
            <Link href="/login" className="text-[#21808D] hover:underline font-medium">
              Sign in
            </Link>
          </p>

          {/* OAuth Buttons */}
          <Button
            variant="outline"
            className="w-full mb-4 border-gray-300 hover:bg-gray-50 h-12"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            type="button"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <Button
            variant="outline"
            className="w-full mb-6 border-gray-300 hover:bg-gray-50 h-12"
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            type="button"
          >
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Continue with GitHub
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Type Selection */}
            <div>
              <Label>I want to use GetCertificates as</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, userType: "corporate" }))}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:border-[#21808D]",
                    formData.userType === "corporate"
                      ? "border-[#21808D] bg-[#21808D]/5"
                      : "border-gray-200 bg-white"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    formData.userType === "corporate" ? "bg-[#FF5733]" : "bg-gray-100"
                  )}>
                    <Building2 className={cn(
                      "w-5 h-5",
                      formData.userType === "corporate" ? "text-white" : "text-gray-600"
                    )} />
                  </div>
                  <span className="text-sm font-medium text-center">Corporate/Business</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, userType: "individual" }))}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:border-[#21808D]",
                    formData.userType === "individual"
                      ? "border-[#21808D] bg-[#21808D]/5"
                      : "border-gray-200 bg-white"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    formData.userType === "individual" ? "bg-[#8FD6BD]" : "bg-gray-100"
                  )}>
                    <User className={cn(
                      "w-5 h-5",
                      formData.userType === "individual" ? "text-black" : "text-gray-600"
                    )} />
                  </div>
                  <span className="text-sm font-medium text-center">Individual</span>
                </button>
              </div>
              {!formData.userType && (
                <p className="text-xs text-gray-500 mt-1">Please select how you plan to use the platform</p>
              )}
            </div>

            <div>
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                className="h-12"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-12"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Use your organization email
              </p>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                className="h-12"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Terms & Policies Acceptance */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                  I agree to the Terms & Policies
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  By signing up, you agree to our{" "}
                  <Link href="/TERMS&CONDTIONS.docx" target="_blank" className="text-[#21808D] hover:underline font-medium">
                    Terms & Conditions
                  </Link>
                  {", "}
                  <Link href="/PRIVACY POLICY.docx" target="_blank" className="text-[#21808D] hover:underline font-medium">
                    Privacy Policy
                  </Link>
                  {", "}
                  <Link href="/USER AGREEMENT.docx" target="_blank" className="text-[#21808D] hover:underline font-medium">
                    User Agreement
                  </Link>
                  {" and "}
                  <Link href="/USER POLICIES.docx" target="_blank" className="text-[#21808D] hover:underline font-medium">
                    User Policies
                  </Link>
                  .
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#21808D] hover:bg-[#1a6370] text-white font-semibold"
              disabled={isLoading || !formData.userType || !agreedToTerms}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#21808D] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f6f6f6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#21808D] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
