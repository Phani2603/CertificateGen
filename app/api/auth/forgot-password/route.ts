import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import PasswordReset from '@/models/PasswordReset'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

// Rate limiting: Store request counts per IP
const requestCounts = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = requestCounts.get(ip)

  if (!limit || now > limit.resetTime) {
    // Reset or initialize
    requestCounts.set(ip, { count: 1, resetTime: now + 15 * 60 * 1000 }) // 15 minutes
    return true
  }

  if (limit.count >= 3) {
    // Max 3 requests per 15 minutes
    return false
  }

  limit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Get IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many password reset requests. Please try again later.' 
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })

    // Always return success to prevent email enumeration
    if (!user) {
      console.log('[ForgotPassword] User not found:', email)
      // Still return success but don't send email
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      })
    }

    // Check if user has a password (OAuth users can't reset password)
    if (!user.password) {
      console.log('[ForgotPassword] OAuth user attempted password reset:', email)
      
      // Send informative email to OAuth users
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.hostinger.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.GOCERTIFLO_SUPPORT_USER,
            pass: process.env.GOCERTIFLO_SUPPORT_PASSWORD,
          },
        })

        const mailOptions = {
          from: `"Certiflo Support" <${process.env.GOCERTIFLO_SUPPORT_USER}>`,
          to: user.email,
          subject: 'Password Reset Not Available - OAuth Account',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #21808D 0%, #1a6370 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Certiflo</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Password Reset Request</p>
              </div>
              
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #21808D; margin-top: 0;">Hello ${user.name},</h2>
                
                <p style="font-size: 16px; color: #555;">
                  We received a password reset request for your account. However, your account was created using <strong>OAuth authentication</strong> (Google or GitHub).
                </p>
                
                <div style="background: #f0f9ff; border-left: 4px solid #21808D; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 15px; color: #555;">
                    <strong>ℹ️ Important:</strong> OAuth accounts don't have passwords. Please sign in using the same method you used to create your account:
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" 
                     style="background: #21808D; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
                    Sign In with OAuth
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #777;">
                  <strong>Available sign-in methods:</strong><br>
                  • Google<br>
                  • GitHub
                </p>
                
                <p style="font-size: 14px; color: #777; border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
                  <strong>Need help?</strong><br>
                  If you're having trouble signing in or didn't make this request, please contact our support team.
                </p>
              </div>
              
              <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                <p>© ${new Date().getFullYear()} Certiflo. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </body>
            </html>
          `,
        }

        await transporter.sendMail(mailOptions)
        console.log('[ForgotPassword] OAuth info email sent to:', email)
      } catch (emailError) {
        console.error('[ForgotPassword] Failed to send OAuth info email:', emailError)
      }
      
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      })
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return NextResponse.json(
        { success: false, error: 'This account has been blocked. Please contact support.' },
        { status: 403 }
      )
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // Create password reset record
    await PasswordReset.create({
      userId: user._id,
      email: user.email,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
    })

    // Prepare reset link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

    // Send email using GoCertiflo support email
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GOCERTIFLO_SUPPORT_USER,
        pass: process.env.GOCERTIFLO_SUPPORT_PASSWORD,
      },
    })

    const mailOptions = {
      from: `"Certiflo Support" <${process.env.GOCERTIFLO_SUPPORT_USER}>`,
      to: user.email,
      subject: 'Reset Your Certiflo Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #21808D 0%, #1a6370 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Certiflo</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Password Reset Request</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #21808D; margin-top: 0;">Hello ${user.name},</h2>
            
            <p style="font-size: 16px; color: #555;">
              We received a request to reset your password for your Certiflo account. If you didn't make this request, you can safely ignore this email.
            </p>
            
            <p style="font-size: 16px; color: #555;">
              To reset your password, click the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #21808D; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #777; border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
              <strong>Security Notice:</strong><br>
              • This link will expire in 1 hour<br>
              • If you didn't request this reset, please secure your account immediately<br>
              • Never share this link with anyone
            </p>
            
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="color: #21808D; word-break: break-all;">${resetUrl}</span>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Certiflo. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </body>
        </html>
      `,
    }

    await transporter.sendMail(mailOptions)

    console.log('[ForgotPassword] Reset email sent to:', email)

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    })
  } catch (error) {
    console.error('[ForgotPassword] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}
