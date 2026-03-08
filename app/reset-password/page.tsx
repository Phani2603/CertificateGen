"use client"

import { Suspense, useState, FormEvent, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"
import { Poppins, Raleway } from "next/font/google"

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] })
const raleway = Raleway({ subsets: ["latin"], weight: ["400", "600", "700"] })

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    hasLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  })

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token")
    }
  }, [token])

  useEffect(() => {
    // Check password requirements
    setPasswordStrength({
      hasLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    })
  }, [password])

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!isPasswordStrong) {
      setError("Please meet all password requirements")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-4 ${poppins.className}`}>
        <Card className="bg-white p-8 shadow-lg rounded-xl border border-gray-100 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${raleway.className}`}>
              Password Reset Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-4 ${poppins.className}`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/login" className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition text-sm mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
          <div className="flex justify-center mb-4">
            <Image src="/cflo1.svg" alt="Certiflo Logo" width={48} height={48} />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${raleway.className}`}>
            Reset Your Password
          </h1>
          <p className="text-gray-600 text-sm">
            Create a strong, secure password for your account
          </p>
        </div>

        <Card className="bg-white p-6 shadow-lg rounded-xl border border-gray-100">
          {error && token && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          {!token ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Invalid Reset Link</h3>
              <p className="text-gray-600 text-sm mb-4">
                This password reset link is invalid or has expired.
              </p>
              <Button
                onClick={() => router.push('/login')}
                variant="outline"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  New Password
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Password Requirements:</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.hasLength ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span className={passwordStrength.hasLength ? 'text-emerald-700' : 'text-gray-600'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.hasUpperCase ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span className={passwordStrength.hasUpperCase ? 'text-emerald-700' : 'text-gray-600'}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.hasLowerCase ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span className={passwordStrength.hasLowerCase ? 'text-emerald-700' : 'text-gray-600'}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.hasNumber ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span className={passwordStrength.hasNumber ? 'text-emerald-700' : 'text-gray-600'}>
                      One number
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.hasSpecialChar ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span className={passwordStrength.hasSpecialChar ? 'text-emerald-700' : 'text-gray-600'}>
                      One special character (!@#$%^&*...)
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isLoading || !isPasswordStrong || password !== confirmPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-3 text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
