import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import PasswordReset from '@/models/PasswordReset'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
        },
        { status: 400 }
      )
    }

    await connectDB()

    // Hash the token to match stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    // Find the password reset record
    const resetRecord = await PasswordReset.findOne({
      token: hashedToken,
      used: false,
      expiresAt: { $gt: new Date() },
    })

    if (!resetRecord) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Find the user
    const user = await User.findById(resetRecord.userId)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return NextResponse.json(
        { success: false, error: 'This account has been blocked. Please contact support.' },
        { status: 403 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user password
    user.password = hashedPassword
    await user.save()

    // Mark reset token as used
    resetRecord.used = true
    await resetRecord.save()

    // Delete all other reset tokens for this user
    await PasswordReset.deleteMany({
      userId: user._id,
      _id: { $ne: resetRecord._id },
    })

    console.log('[ResetPassword] Password reset successful for:', user.email)

    return NextResponse.json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
    })
  } catch (error) {
    console.error('[ResetPassword] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
