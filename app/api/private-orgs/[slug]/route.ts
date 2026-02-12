import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import PrivateOrg from '@/models/PrivateOrg'
import User from '@/models/User'
import { auth } from '@/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()
    const { slug } = await params
    
    const organization = await PrivateOrg.findOne({ slug })
      .select('name slug description logoUrl website ownerId allowedUsers isPublic createdAt')
      .lean()

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    const response = NextResponse.json({
      success: true,
      organization,
    })
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    return response
  } catch (error) {
    console.error('[Private Org] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch organization',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()
    const { slug } = await params
    const data = await request.json()

    // Find org and check ownership
    const organization = await PrivateOrg.findOne({ slug })

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Verify user is owner or admin (for now just owner check or if they are in allowedUsers list? usually only owner/admins can edit settings)
    // For simplicity, let's assume owner or allowed user can edit for now, or strictly owner.
    // Let's check if the current user is the owner.
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const isOwner = organization.ownerId.toString() === user._id.toString()
    // const isAllowed = organization.allowedUsers.includes(user._id) 
    
    if (!isOwner) {
       return NextResponse.json(
        { success: false, error: 'Only the owner can update settings' },
        { status: 403 }
      )
    }

    // Update fields
    if (data.name) organization.name = data.name
    if (data.description !== undefined) organization.description = data.description
    if (data.website !== undefined) organization.website = data.website
    if (data.logoUrl !== undefined) organization.logoUrl = data.logoUrl
    if (data.isPublic !== undefined) organization.isPublic = data.isPublic

    await organization.save()

    return NextResponse.json({
      success: true,
      organization,
    })

  } catch (error) {
    console.error('[Private Org Update] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update organization',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
