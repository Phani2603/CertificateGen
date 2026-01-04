import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import PrivateOrg from '@/models/PrivateOrg'
import Invitation from '@/models/Invitation'
import User from '@/models/User'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { slug } = await params
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    // 1. Verify Organization and Permissions
    const organization = await PrivateOrg.findOne({ slug })
    if (!organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 })
    }

    const currentUser = await User.findOne({ email: session.user.email })
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const isOwner = organization.ownerId.toString() === currentUser._id.toString()
    // Allow owner or existing members to invite? Usually just owner/admins.
    // For now, let's restrict to owner.
    if (!isOwner) {
      return NextResponse.json({ success: false, error: 'Only the owner can invite members' }, { status: 403 })
    }

    // 2. Check if user is already a member
    const existingMember = await User.findOne({ 
      email: email.toLowerCase(),
      $or: [
        { _id: organization.ownerId },
        { _id: { $in: organization.allowedUsers } }
      ]
    })

    if (existingMember) {
      return NextResponse.json({ success: false, error: 'User is already a member' }, { status: 400 })
    }

    // 3. Check for existing pending invitation
    const existingInvite = await Invitation.findOne({
      email: email.toLowerCase(),
      privateOrgId: organization._id,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    })

    if (existingInvite) {
      return NextResponse.json({ success: false, error: 'Invitation already sent' }, { status: 400 })
    }

    // 4. Create Invitation
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    const invitation = await Invitation.create({
      email: email.toLowerCase(),
      privateOrgId: organization._id,
      privateOrgName: organization.name,
      invitedBy: currentUser._id,
      invitedByEmail: currentUser.email,
      token,
      status: 'pending',
      expiresAt
    })

    // 5. Send Email
    // Send users to accept page. If authenticated, it will accept immediately;
    // if not, it will forward to login preserving the invite token.
    const inviteUrl = `${process.env.NEXTAUTH_URL}/invitations/accept?token=${token}`
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Invitation to join ${organization.name} on CertificateGen`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited!</h2>
          <p><strong>${currentUser.name}</strong> has invited you to join <strong>${organization.name}</strong> on CertificateGen.</p>
          <p>Click the button below to accept the invitation and create your account:</p>
          <a href="${inviteUrl}" style="display: inline-block; background-color: #21808D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Accept Invitation</a>
          <p style="color: #666; font-size: 14px;">This link will expire in 7 days.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, invitation })

  } catch (error) {
    console.error('[Invite API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { slug } = await params

    const organization = await PrivateOrg.findOne({ slug })
    if (!organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 })
    }

    // Fetch invitations
    const invitations = await Invitation.find({
      privateOrgId: organization._id,
    }).sort({ createdAt: -1 })

    return NextResponse.json({ success: true, invitations })

  } catch (error) {
    console.error('[Invite API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}
