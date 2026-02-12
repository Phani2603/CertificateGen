import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import PrivateOrg from '@/models/PrivateOrg'
import User from '@/models/User'

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

    // Check if user has access
    const currentUser = await User.findOne({ email: session.user.email })
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const isOwner = organization.ownerId.toString() === currentUser._id.toString()
    const isMember = organization.allowedUsers.includes(currentUser._id)

    if (!isOwner && !isMember) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Fetch owner details
    const owner = await User.findById(organization.ownerId).select('name email image')

    // Fetch members details
    const members = await User.find({
      _id: { $in: organization.allowedUsers }
    }).select('name email image')

    const response = NextResponse.json({
      success: true,
      owner,
      members
    })
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    return response

  } catch (error) {
    console.error('[Members API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const { memberId } = await request.json()

    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Member ID is required' }, { status: 400 })
    }

    // Get the organization
    const organization = await PrivateOrg.findOne({ slug })
    if (!organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 })
    }

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email })
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Verify the current user is the owner
    const isOwner = organization.ownerId.toString() === currentUser._id.toString()
    if (!isOwner) {
      return NextResponse.json({ success: false, error: 'Only the owner can remove members' }, { status: 403 })
    }

    // Cannot remove the owner
    if (memberId === organization.ownerId.toString()) {
      return NextResponse.json({ success: false, error: 'Cannot remove the owner' }, { status: 400 })
    }

    // Remove member from allowedUsers
    organization.allowedUsers = organization.allowedUsers.filter(
      (userId: any) => userId.toString() !== memberId
    )

    await organization.save()

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    })
  } catch (error) {
    console.error('[Remove Member API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}
