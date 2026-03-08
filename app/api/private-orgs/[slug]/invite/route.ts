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
    
    // Use Certiflo Support email for corporate invitations
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GOCERTIFLO_SUPPORT_USER,
        pass: process.env.GOCERTIFLO_SUPPORT_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: `"Certiflo" <${process.env.GOCERTIFLO_SUPPORT_USER}>`,
      to: email,
      subject: `Invitation to join ${organization.name} on Certiflo`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: #667eea; padding: 40px 30px; text-align: center;">
                      <h1 style="font-family: 'Libre Baskerville', Georgia, serif; color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">You're Invited!</h1>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #1a1a1a; font-size: 18px; margin: 0 0 20px; line-height: 1.6;">
                        Hello,
                      </p>
                      
                      <p style="color: #333333; font-size: 16px; margin: 0 0 20px; line-height: 1.6;">
                        <strong>${currentUser.name}</strong> has invited you to join <strong>${organization.name}</strong> on the Senement CertificateGen platform.
                      </p>
                      
                      <div style="background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px;">
                        <p style="color: #333; font-size: 15px; margin: 0; line-height: 1.6;">
                          🎉 <strong>What's Next?</strong><br/>
                          Click the button below to accept your invitation and get started with your account.
                        </p>
                      </div>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${inviteUrl}" style="display: inline-block; background: #667eea; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">Accept Invitation</a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #666666; font-size: 14px; margin: 25px 0 10px; line-height: 1.6; text-align: center;">
                        Or copy and paste this link in your browser:
                      </p>
                      <p style="color: #667eea; font-size: 13px; margin: 0; line-height: 1.6; text-align: center; word-break: break-all;">
                        ${inviteUrl}
                      </p>
                      
                      <div style="background-color: #fff8e1; border: 1px solid #ffd700; padding: 15px; margin: 25px 0; border-radius: 6px;">
                        <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                          ⏰ <strong>Note:</strong> This invitation link will expire in 7 days.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                      <p style="color: #666666; font-size: 14px; margin: 0 0 10px; line-height: 1.6;">
                        <strong>Best regards,</strong><br/>
                        The Senement Team
                      </p>
                      <p style="color: #999999; font-size: 12px; margin: 15px 0 0; line-height: 1.5;">
                        This is an automated invitation email.<br/>
                        If you have any questions, please contact the person who invited you.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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

    const response = NextResponse.json({ success: true, invitations })
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    return response

  } catch (error) {
    console.error('[Invite API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}
