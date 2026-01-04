import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import Invitation from '@/models/Invitation'
import User from '@/models/User'
import PrivateOrg from '@/models/PrivateOrg'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 })
    }

    const invitation = await Invitation.findOne({ 
      token, 
      status: 'pending',
      expiresAt: { $gt: new Date() }
    })

    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Invalid or expired invitation' }, { status: 400 })
    }

    // Verify email matches logged in user
    if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'This invitation is for a different email address' }, { status: 403 })
    }

    // Update User
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Update user to corporate and link to org
    user.userType = 'corporate'
    user.privateOrgId = invitation.privateOrgId
    await user.save()

    // Add user to Org allowedUsers
    const org = await PrivateOrg.findByIdAndUpdate(
      invitation.privateOrgId,
      { $addToSet: { allowedUsers: user._id } },
      { new: true }
    )

    if (!org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 })
    }

    // Update Invitation
    invitation.status = 'accepted'
    await invitation.save()

    return NextResponse.json({ 
      success: true, 
      orgSlug: org.slug,
      message: 'Invitation accepted successfully' 
    })

  } catch (error) {
    console.error('[Invitation Accept] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to accept invitation' }, { status: 500 })
  }
}
