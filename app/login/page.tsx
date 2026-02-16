"use client"

import { Suspense, useState, FormEvent, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import { UserTypeSelectionModal } from "@/components/UserTypeSelectionModal"
import { Poppins, Raleway } from "next/font/google"

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] })
const raleway = Raleway({ subsets: ["latin"], weight: ["400", "600", "700"] })

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showTypeSelection, setShowTypeSelection] = useState(false)
  const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  useEffect(() => {
    async function checkUserType() {
      // Only check once when page loads, not during form submission
      if (status === "authenticated" && !isLoading && !hasCheckedRedirect) {
        setHasCheckedRedirect(true)

        // Check if user was on a verification page before logging in
        const returnToVerification = typeof window !== 'undefined'
          ? sessionStorage.getItem('returnToVerification')
          : null

        if (returnToVerification) {
          // Clear the stored URL and redirect back to verification page
          sessionStorage.removeItem('returnToVerification')
          router.push(returnToVerification)
          return
        }

        // Handle Invite Token if present
        if (inviteToken) {
          try {
            const res = await fetch('/api/invitations/accept', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: inviteToken })
            })
            const data = await res.json()
            if (data.success) {
              // Redirect to the org dashboard
              router.push(`/${data.orgSlug}/dashboard`)
              return
            } else {
              console.error('Failed to accept invite:', data.error)
              // Continue to normal redirect logic but maybe show error?
            }
          } catch (err) {
            console.error('Error accepting invite:', err)
          }
        }

        try {
          const response = await fetch('/api/profile')

          if (!response.ok) {
            console.error('Profile fetch failed:', response.status)
            return
          }

          const data = await response.json()

          if (data.success && data.user) {
            if (!data.user.userType) {
              setShowTypeSelection(true)
            } else if (data.user.userType === 'individual') {
              router.push('/individual-dashboard')
            } else if (data.user.userType === 'corporate') {
              // Check if user has organization
              if (data.user.privateOrg) {
                router.push(`/${data.user.privateOrg.slug}/dashboard`)
              } else {
                router.push('/create-organization')
              }
            } else if (data.user.userType === 'academic') {
              // Academic users go to general dashboard
              router.push('/dashboard')
            }
          }
        } catch (error) {
          console.error('Error checking user type:', error)
        }
      }
    }

    checkUserType()
  }, [status, router, isLoading, hasCheckedRedirect, inviteToken])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
        setIsLoading(false)
      } else {
        // Successfully logged in - allow useEffect to handle redirect
        setHasCheckedRedirect(false)
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <>
      <UserTypeSelectionModal
        isOpen={showTypeSelection}
        onClose={() => setShowTypeSelection(false)}
      />

      <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-2 md:p-3 ${poppins.className}`}>
        {/* Mobile Back Button */}
        <div className="md:hidden fixed top-2 left-2 z-10">
          <Link href="/newlanding/hero-section" className="inline-flex items-center gap-1 text-gray-600 hover:text-emerald-600 transition bg-white px-2 py-1 rounded-lg shadow-sm text-xs">
            <ArrowLeft className="h-3 w-3" />
            <span className="font-medium">Back</span>
          </Link>
        </div>

        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-4 md:gap-6 items-center">
          {/* Left Side - Branding */}
          <div className="hidden md:block">
            <Link href="/newlanding/hero-section" className="inline-flex items-center gap-1.5 mb-4 text-gray-600 hover:text-emerald-600 transition text-xs">
              <ArrowLeft className="h-3 w-3" />
              Back to home
            </Link>
            <h1 className={`text-3xl lg:text-4xl font-black mb-3 leading-tight ${raleway.className}`}>
              Welcome
              <br />
              <span className="text-emerald-600">Back</span>
            </h1>
            <p className="text-sm lg:text-base text-gray-600 mb-4">
              Sign in to continue creating professional certificates.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  ✓
                </div>
                <p className="text-xs text-gray-700">Bulk certificate generation</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  ✓
                </div>
                <p className="text-xs text-gray-700">Unique verification links</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  ✓
                </div>
                <p className="text-xs text-gray-700">Team collaboration</p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <Card className="bg-white p-4 md:p-6 lg:p-7 shadow-md rounded-xl border border-gray-100">
            <div className="flex items-center gap-1.5 mb-4">
              <Image src="/cflo1.svg" alt="Certiflo Logo" width={32} height={32} />
            </div>

            <h2 className={`text-lg md:text-xl font-bold mb-1 ${raleway.className}`}>Sign in</h2>
            <p className="text-gray-600 mb-4 text-xs">
              Don't have an account?{" "}
              <Link href="/signup" className="text-emerald-600 hover:underline font-semibold">
                Sign up
              </Link>
            </p>

            {/* OAuth Buttons */}
            <Button
              variant="outline"
              className="w-full mb-2 border-gray-200 hover:bg-gray-50 h-9 text-xs rounded-lg transition-all"
              onClick={() => {
                const cb = `/login${inviteToken ? `?invite=${inviteToken}` : ''}`
                signIn('google', { callbackUrl: cb })
              }}
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
              className="w-full mb-3 border-gray-200 hover:bg-gray-50 h-9 text-xs rounded-lg transition-all"
              onClick={() => {
                const cb = `/login${inviteToken ? `?invite=${inviteToken}` : ''}`
                signIn('github', { callbackUrl: cb })
              }}
              type="button"
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Continue with GitHub
            </Button>

            <div className="relative mb-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="px-2 bg-white text-gray-500 font-medium">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div>
                <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-9 mt-1 rounded-lg border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-xs"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                  <Link href="#" className="text-[10px] text-gray-600 hover:text-emerald-600 hover:underline">
                    Forgot?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="h-9 rounded-lg border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-xs"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-9 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all active:scale-[0.98] text-xs"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <p className="text-center text-[10px] text-gray-500 mt-3 leading-relaxed">
              By signing in, you agree to our{" "}
              <Link href="/TERMS&CONDTIONS.docx" target="_blank" className="text-emerald-600 hover:underline font-medium">
                Terms & Conditions
              </Link>
              {", "}
              <Link href="/PRIVACY POLICY.docx" target="_blank" className="text-emerald-600 hover:underline font-medium">
                Privacy Policy
              </Link>
              {", "}
              <Link href="/USER AGREEMENT.docx" target="_blank" className="text-emerald-600 hover:underline font-medium">
                User Agreement
              </Link>
              {" and "}
              <Link href="/USER POLICIES.docx" target="_blank" className="text-emerald-600 hover:underline font-medium">
                User Policies
              </Link>
              .
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-3 text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
