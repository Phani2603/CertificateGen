import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import PrivateOrg from '@/models/PrivateOrg'
import User from '@/models/User'

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
    const { newOwnerId } = await request.json()

    if (!newOwnerId) {
      return NextResponse.json({ success: false, error: 'New owner ID is required' }, { status: 400 })
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
      return NextResponse.json({ success: false, error: 'Only the owner can transfer ownership' }, { status: 403 })
    }

    // Verify the new owner is a member
    const isMember = organization.allowedUsers.some(
      (userId: any) => userId.toString() === newOwnerId
    )
    if (!isMember) {
      return NextResponse.json({ success: false, error: 'New owner must be a member of the organization' }, { status: 400 })
    }

    // Transfer ownership: swap current owner and new owner
    // Remove new owner from allowedUsers
    organization.allowedUsers = organization.allowedUsers.filter(
      (userId: any) => userId.toString() !== newOwnerId
    )
    
    // Add current owner to allowedUsers
    organization.allowedUsers.push(currentUser._id)
    
    // Set new owner
    organization.ownerId = newOwnerId

    await organization.save()

    return NextResponse.json({
      success: true,
      message: 'Ownership transferred successfully'
    })
  } catch (error) {
    console.error('[Transfer Ownership API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to transfer ownership' },
      { status: 500 }
    )
  }
}
