import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { name, email, password, userType, inviteToken } = body

    if (!name || !email || !password || !userType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (userType !== 'corporate' && userType !== 'individual') {
      return NextResponse.json(
        { success: false, error: 'Invalid user type' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Prepare user data
    const userData: any = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      provider: 'credentials',
      userType,
    }

    // Handle Invite Token
    if (inviteToken) {
      try {
        const Invitation = (await import('@/models/Invitation')).default
        const PrivateOrg = (await import('@/models/PrivateOrg')).default

        const invitation = await Invitation.findOne({ 
          token: inviteToken, 
          status: 'pending',
          expiresAt: { $gt: new Date() }
        })

        if (invitation) {
          // Verify email matches (optional but recommended)
          if (invitation.email.toLowerCase() !== email.toLowerCase()) {
             // For now, we'll allow it but log it, or we could reject.
             // Let's reject to prevent token stealing.
             return NextResponse.json({ success: false, error: 'Email does not match invitation' }, { status: 400 })
          }

          userData.privateOrgId = invitation.privateOrgId
          userData.userType = 'corporate' // Force corporate if invited to org
          
          // Update invitation status
          invitation.status = 'accepted'
          await invitation.save()
        }
      } catch (err) {
        console.error('[Signup] Error processing invite:', err)
        // Continue without invite if error
      }
    }

    // Create user - ensure we get a single user object
    const newUser = await User.create(userData)
    // User.create can return an array if you pass an array, but we're passing a single object
    const user = Array.isArray(newUser) ? newUser[0] : newUser

    // Post-creation: Add to Org if invited
    if (inviteToken && userData.privateOrgId) {
      const PrivateOrg = (await import('@/models/PrivateOrg')).default
      await PrivateOrg.findByIdAndUpdate(userData.privateOrgId, {
        $addToSet: { allowedUsers: user._id }
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('[Signup] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
