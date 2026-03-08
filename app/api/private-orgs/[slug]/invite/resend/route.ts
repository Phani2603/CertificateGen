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
    const inviteUrl = `${process.env.NEXTAUTH_URL}/invitations/accept?token=${newToken}`
    
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
      to: invitation.email,
      subject: `Reminder: Invitation to join ${organization.name} on Certiflo`,
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
                      <h1 style="font-family: 'Libre Baskerville', Georgia, serif; color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">Invitation Reminder</h1>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #1a1a1a; font-size: 18px; margin: 0 0 20px; line-height: 1.6;">
                        Hello,
                      </p>
                      
                      <p style="color: #333333; font-size: 16px; margin: 0 0 20px; line-height: 1.6;">
                        This is a friendly reminder that you have been invited to join <strong>${organization.name}</strong> on the Senement CertificateGen platform.
                      </p>
                      
                      <div style="background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px;">
                        <p style="color: #333; font-size: 15px; margin: 0; line-height: 1.6;">
                          ⏰ <strong>Don't miss out!</strong><br/>
                          Your invitation is still active. Click below to accept and get started.
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
                        This is an automated reminder email.<br/>
                        If you didn't expect this invitation, you can safely ignore this email.
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

    return NextResponse.json({ success: true, message: 'Invitation resent successfully' })

  } catch (error) {
    console.error('Error resending invitation:', error)
    return NextResponse.json({ success: false, error: 'Failed to resend invitation' }, { status: 500 })
  }
}
