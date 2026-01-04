import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Invitation from '@/models/Invitation'
import PrivateOrg from '@/models/PrivateOrg'
import User from '@/models/User'
import { auth } from '@/auth'
import crypto from 'crypto'

// GET invitations for an organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const privateOrgId = searchParams.get('privateOrgId')

    if (!privateOrgId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const invitations = await Invitation.find({ privateOrgId })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      invitations,
    })
  } catch (error) {
    console.error('[Invitations GET] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch invitations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST create and send invitation
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { email, privateOrgId } = body

    if (!email || !privateOrgId) {
      return NextResponse.json(
        { success: false, error: 'Email and organization ID are required' },
        { status: 400 }
      )
    }

    // Verify organization exists and user is owner
    const organization = await PrivateOrg.findById(privateOrgId)
    
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    if (organization.ownerId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { success: false, error: 'Only organization owner can send invitations' },
        { status: 403 }
      )
    }

    // Check if invitation already exists
    const existingInvitation = await Invitation.findOne({
      email,
      privateOrgId,
      status: 'pending',
    })

    if (existingInvitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation already sent to this email' },
        { status: 400 }
      )
    }

    // Generate token
    const token = await Invitation.generateToken()

    // Create invitation
    const invitation = await Invitation.create({
      email,
      privateOrgId,
      privateOrgName: organization.name,
      invitedBy: user._id,
      token,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    })

    // TODO: Send email via email service
    // await sendInvitationEmail(email, organization.name, token)

    return NextResponse.json({
      success: true,
      invitation: {
        _id: invitation._id,
        email: invitation.email,
        status: invitation.status,
      },
    })
  } catch (error) {
    console.error('[Invitations POST] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create invitation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
