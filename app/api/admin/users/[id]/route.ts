import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

// Helper to verify admin session cookie
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  return !!adminSession?.value
}

// GET - Fetch single user details with comprehensive data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()
    const { id } = await params

    // Fetch user with populated references
    const user = await User.findById(id)
      .select('-password')
      .populate('organizationId', 'name type city state country logoUrl')
      .populate('privateOrgId', 'name slug description logoUrl website')
      .lean()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Import models dynamically to avoid circular dependencies
    const Certificate = (await import('@/models/Certificate')).default
    const Event = (await import('@/models/Event')).default
    const Organization = (await import('@/models/Organization')).default
    const PrivateOrg = (await import('@/models/PrivateOrg')).default

    // Fetch certificates received by this user
    let certificates: any[] = []
    let totalCertificatesReceived = 0
    try {
      certificates = await Certificate.find({ recipientEmail: user.email })
        .select('verificationId eventName eventDate organizationName clubName issueDate isValid templateS3Key fieldConfiguration eventId')
        .sort({ issueDate: -1 })
        .limit(10)
        .lean()
      totalCertificatesReceived = await Certificate.countDocuments({ recipientEmail: user.email })
    } catch (error) {
      console.error('Error fetching certificates:', error)
    }

    // Fetch events created by this user
    let events: any[] = []
    let totalEventsCreated = 0
    try {
      events = await Event.find({ createdBy: id })
        .select('name description date certificatesGenerated')
        .sort({ date: -1 })
        .limit(10)
        .lean()
      totalEventsCreated = await Event.countDocuments({ createdBy: id })
    } catch (error) {
      console.error('Error fetching events:', error)
    }

    // Fetch organizations where user is a member
    let memberOrganizations: any[] = []
    try {
      memberOrganizations = await Organization.find({ members: id })
        .select('name type city state logoUrl')
        .lean()
    } catch (error) {
      console.error('Error fetching member organizations:', error)
    }

    // Fetch organizations created by this user
    let createdOrganizations: any[] = []
    try {
      createdOrganizations = await Organization.find({ createdBy: id })
        .select('name type city state logoUrl members')
        .lean()
    } catch (error) {
      console.error('Error fetching created organizations:', error)
    }

    // Fetch private organizations owned by this user
    let ownedPrivateOrgs: any[] = []
    try {
      ownedPrivateOrgs = await PrivateOrg.find({ ownerId: id })
        .select('name slug description logoUrl website allowedUsers')
        .lean()
    } catch (error) {
      console.error('Error fetching owned private orgs:', error)
    }

    // Fetch private organizations where user is a member
    let memberPrivateOrgs: any[] = []
    try {
      memberPrivateOrgs = await PrivateOrg.find({ allowedUsers: id, ownerId: { $ne: id } })
        .select('name slug description logoUrl website')
        .lean()
    } catch (error) {
      console.error('Error fetching member private orgs:', error)
    }

    // Calculate statistics
    let totalCertificatesIssued = 0
    try {
      // Count certificates issued through events created by this user
      const eventIds = events.map(e => e._id)
      totalCertificatesIssued = await Certificate.countDocuments({
        eventId: { $in: eventIds }
      })
    } catch (error) {
      console.error('Error calculating certificates issued:', error)
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        userType: user.userType,
        phone: user.phone,
        bio: user.bio,
        address: user.address,
        organization: user.organization,
        bannerColor: user.bannerColor,
        provider: user.provider,
        emailVerified: user.emailVerified,
        isBlocked: user.isBlocked,
        isSuspended: user.isSuspended,
        suspendedUntil: user.suspendedUntil,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,

        // Populated references
        organizationId: user.organizationId,
        privateOrgId: user.privateOrgId,
      },
      certificates: {
        received: certificates,
        totalReceived: totalCertificatesReceived,
        totalIssued: totalCertificatesIssued,
      },
      events: {
        created: events,
        total: totalEventsCreated,
      },
      organizations: {
        academic: {
          created: createdOrganizations.filter(o => o.type !== 'custom'),
          member: memberOrganizations.filter(o => o.type !== 'custom'),
        },
        corporate: {
          owned: ownedPrivateOrgs,
          member: memberPrivateOrgs,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PATCH - Update user details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()
    const { id } = await params
    const body = await request.json()

    const { name, email, userType, phone, bio } = body

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Update fields
    if (name !== undefined) user.name = name
    if (email !== undefined) user.email = email
    if (userType !== undefined) user.userType = userType
    if (phone !== undefined) user.phone = phone
    if (bio !== undefined) user.bio = bio

    await user.save()

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
      },
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()
    const { id } = await params

    const user = await User.findByIdAndDelete(id)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
