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
    const { invitationId, email } = await request.json()

    if (!invitationId && !email) {
      return NextResponse.json({ success: false, error: 'Invitation ID or Email is required' }, { status: 400 })
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
    if (!isOwner) {
      return NextResponse.json({ success: false, error: 'Only the owner can resend invitations' }, { status: 403 })
    }

    // 2. Find the invitation
    let query: any = { privateOrgId: organization._id, status: 'pending' }
    if (invitationId) {
      query._id = invitationId
    } else {
      query.email = email.toLowerCase()
    }

    const invitation = await Invitation.findOne(query)

    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Pending invitation not found' }, { status: 404 })
    }

    // 3. Update Invitation (extend expiry, rotate token)
    const newToken = crypto.randomBytes(32).toString('hex')
    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + 7) // Extend by 7 days

    invitation.token = newToken
    invitation.expiresAt = newExpiresAt
    invitation.updatedAt = new Date()
    await invitation.save()

    // 4. Resend Email
    const inviteUrl = `${process.env.NEXTAUTH_URL}/signup?invite=${newToken}`
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: invitation.email,
      subject: `Invitation Reminder: Join ${organization.name} on CertificateGen`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Invitation Reminder</h2>
          <p>You have been invited to join <strong>${organization.name}</strong> on CertificateGen.</p>
          <p>This link is valid for 7 days.</p>
          <div style="margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${inviteUrl}">${inviteUrl}</a></p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you didn't expect this invitation, you can ignore this email.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: 'Invitation resent successfully' })

  } catch (error) {
    console.error('Error resending invitation:', error)
    return NextResponse.json({ success: false, error: 'Failed to resend invitation' }, { status: 500 })
  }
}
