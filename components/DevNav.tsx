"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { 
  X, 
  Eye, 
  EyeOff, 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2,
  Lock,
  Mail,
  Key,
  Info
} from 'lucide-react'
import { useCredentials } from '@/hooks/useCredentials'

interface DevNavProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function DevNav({ isOpen, onClose, onSuccess }: DevNavProps) {
  const [email, setEmail] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { login, isValidating, error, clearError } = useCredentials()

  // Security status indicators
  const [securityChecks, setSecurityChecks] = useState({
    https: false,
    webCrypto: false,
    secureContext: false
  })

  // Check security environment on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSecurityChecks({
        https: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
        webCrypto: !!(window.crypto && window.crypto.subtle),
        secureContext: window.isSecureContext
      })
    }
  }, [])

  // Validate email format in real-time
  const isEmailValid = email.trim() === '' || /^[a-zA-Z0-9._%+-]+@(gmail\.com|[a-zA-Z0-9.-]+\.edu\.in)$/.test(email.trim())
  
  // Validate app password format in real-time
  const cleanPassword = appPassword.replace(/\s/g, '')
  const isPasswordValid = appPassword === '' || (cleanPassword.length === 16 && /^[a-zA-Z0-9]+$/.test(cleanPassword))
  
  // Check if form is ready to submit
  const canSubmit = email.trim() !== '' && appPassword !== '' && isEmailValid && isPasswordValid && !isSubmitting && !isValidating

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canSubmit) return

    setIsSubmitting(true)
    clearError()

    try {
      console.log(`[DevNav] Attempting login with email: ${email.trim().toLowerCase()}`)
      console.log(`[DevNav] Password length: ${appPassword.length}`)
      console.log(`[DevNav] Password (first 4 chars): ${appPassword.substring(0, 4)}`)
      
      const success = await login(email.trim().toLowerCase(), appPassword)
      
      if (success) {
        // Clear form
        setEmail('')
        setAppPassword('')
        setShowPassword(false)
        
        // Notify parent component
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('[DevNav] Submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting && !isValidating) {
      setEmail('')
      setAppPassword('')
      setShowPassword(false)
      clearError()
      onClose()
    }
  }

  // Format app password with spaces for better readability
  const formatAppPassword = (value: string) => {
    const clean = value.replace(/\s/g, '')
    const formatted = clean.replace(/(.{4})/g, '$1 ').trim()
    return formatted.substring(0, 19) // 16 chars + 3 spaces max
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-cyan-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-semibold">Email Credentials</h2>
              <p className="text-sm text-cyan-100">Secure session authentication</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting || isValidating}
            className="text-white hover:bg-cyan-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Security Status */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Lock className="w-4 h-4" />
              <span>Security Status</span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center space-x-2">
                {securityChecks.https ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                )}
                <span className={securityChecks.https ? 'text-green-700' : 'text-red-700'}>
                  {securityChecks.https ? 'Secure connection (HTTPS)' : 'Insecure connection'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {securityChecks.webCrypto ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                )}
                <span className={securityChecks.webCrypto ? 'text-green-700' : 'text-red-700'}>
                  Web Crypto API available
                </span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="text-orange-800 font-medium mb-1">Your credentials are secure</p>
                <p className="text-orange-700">
                  Your email and app password are encrypted using AES-256 and stored only for this session. 
                  They are never sent to our servers in plain text.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Email Address</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@gmail.com or email@university.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting || isValidating}
                className={`${!isEmailValid ? 'border-red-300 focus:border-red-500' : ''}`}
                autoComplete="username"
              />
              {email && !isEmailValid && (
                <p className="text-xs text-red-600">Please enter a valid Gmail address or educational email (.edu.in)</p>
              )}
            </div>

            {/* App Password Input */}
            <div className="space-y-2">
              <Label htmlFor="appPassword" className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>App Password</span>
              </Label>
              <div className="relative">
                <Input
                  id="appPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="abcd efgh ijkl mnop"
                  value={formatAppPassword(appPassword)}
                  onChange={(e) => setAppPassword(e.target.value.replace(/\s/g, ''))}
                  disabled={isSubmitting || isValidating}
                  className={`pr-10 font-mono ${!isPasswordValid ? 'border-red-300 focus:border-red-500' : ''}`}
                  autoComplete="current-password"
                  maxLength={19} // 16 chars + 3 spaces
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting || isValidating}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {appPassword && !isPasswordValid && (
                <p className="text-xs text-red-600">App password must be 16 characters (letters and numbers only)</p>
              )}
              <p className="text-xs text-gray-500">
                For Gmail: Google Account → Security → 2-Step Verification → App passwords<br/>
                For .edu.in: Use your institutional email password or app-specific password
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              disabled={!canSubmit}
            >
              {isSubmitting || isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isValidating ? 'Validating...' : 'Connecting...'}
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Connect Securely
                </>
              )}
            </Button>
          </form>

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>🔒 Your credentials are encrypted with AES-256</p>
            <p>⏱️ Stored only for this session (expires in 1 hour)</p>
            <p>🔄 Cleared automatically when you close the browser</p>
          </div>
        </div>
      </Card>
    </div>
  )
}