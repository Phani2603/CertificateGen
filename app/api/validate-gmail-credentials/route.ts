import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

/**
 * Secure Gmail credential validation endpoint
 * Tests SMTP connection without storing credentials
 * Implements rate limiting and security measures
 */

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5 // Max 5 validation attempts per IP per window

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP.trim()
  }
  
  return 'unknown'
}

// Rate limiting check
function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)
  
  if (!entry || now > entry.resetTime) {
    // Reset or first request
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true }
  }
  
  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { allowed: false, resetTime: entry.resetTime }
  }
  
  // Increment counter
  entry.count++
  rateLimitStore.set(ip, entry)
  return { allowed: true }
}

// Validate input data
function validateInput(email: string, appPassword: string): { valid: boolean; error?: string } {
  // Email validation
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' }
  }
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|[a-zA-Z0-9.-]+\.edu\.in)$/
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Please enter a valid Gmail address or educational email (.edu.in)' }
  }
  
  // App password validation
  if (!appPassword || typeof appPassword !== 'string') {
    return { valid: false, error: 'App password is required' }
  }
  
  const cleanPassword = appPassword.replace(/\s/g, '')
  if (cleanPassword.length !== 16) {
    return { valid: false, error: `App password must be 16 characters (got ${cleanPassword.length})` }
  }
  
  if (!/^[a-zA-Z0-9]+$/.test(cleanPassword)) {
    return { valid: false, error: 'App password contains invalid characters' }
  }
  
  console.log(`[Validation] App password length: ${cleanPassword.length}, format: valid`)
  
  return { valid: true }
}

// Test SMTP connection - Always use Gmail SMTP for both Gmail and .edu.in emails
async function testEmailConnection(email: string, appPassword: string): Promise<boolean> {
  let transporter: nodemailer.Transporter | null = null
  
  try {
    console.log(`[Credential Validation] Testing connection for: ${email}`)
    console.log(`[Credential Validation] Password length: ${appPassword.length}`)
    
    // Always use Gmail SMTP (works for both gmail.com and .edu.in)
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: email,
        pass: appPassword,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      debug: true,
      logger: true
    })
    
    console.log('[Credential Validation] Attempting connection to smtp.gmail.com:587...')
    
    // Verify connection
    await transporter.verify()
    
    console.log(`[Credential Validation] ✅ Success for ${email.substring(0, 5)}***`)
    return true
    
  } catch (error) {
    console.error(`[Credential Validation] ❌ Failed for ${email.substring(0, 5)}***:`, error)
    return false
  } finally {
    // Always close the connection
    if (transporter) {
      transporter.close()
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Security headers
    const headers = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache'
    }
    
    // Check if HTTPS (in production)
    if (process.env.NODE_ENV === 'production' && !request.url.startsWith('https://')) {
      return NextResponse.json(
        { success: false, error: 'HTTPS required for credential validation' },
        { status: 400, headers }
      )
    }
    
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitCheck = checkRateLimit(clientIP)
    
    if (!rateLimitCheck.allowed) {
      const resetTime = rateLimitCheck.resetTime ? new Date(rateLimitCheck.resetTime) : new Date()
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many validation attempts. Please try again later.',
          resetTime: resetTime.toISOString()
        },
        { status: 429, headers }
      )
    }
    
    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400, headers }
      )
    }
    
    const { email, appPassword } = body
    
    // Validate input
    const validation = validateInput(email, appPassword)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400, headers }
      )
    }
    
    // Test email connection
    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = appPassword.replace(/\s/g, '')
    
    console.log(`[Credential Validation] Testing connection for: ${cleanEmail}`)
    console.log(`[Credential Validation] Password length: ${cleanPassword.length}`)
    
    const isValid = await testEmailConnection(cleanEmail, cleanPassword)
    
    if (isValid) {
      return NextResponse.json(
        { success: true, message: 'Credentials validated successfully' },
        { status: 200, headers }
      )
    } else {
      // Provide more helpful error message based on email type
      const isEducational = email.includes('.edu.in')
      const errorMessage = isEducational 
        ? 'Unable to connect to your institutional email server. Please verify: 1) Your email and password are correct, 2) Your institution allows SMTP access, 3) You may need to enable "Less secure app access" or use an app-specific password from your institution\'s email settings.'
        : 'Invalid email or app password. Please check your credentials.'
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 401, headers }
      )
    }
    
  } catch (error) {
    console.error('[Credential Validation API] Unexpected error:', error)
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }}
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}