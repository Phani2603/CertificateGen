import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Organization from '@/models/Organization'
import Club from '@/models/Club'

// GET - Fetch user profile
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

    let user = await User.findOne({ email: session.user.email })
      .populate('organizationId', 'name logoUrl')
      .populate('clubs', 'name color logoUrl')

    console.log('[Profile API] User fetched:', {
      userId: user?._id,
      email: user?.email,
      hasOrganizationId: !!user?.organizationId,
      organizationIdRaw: user?.organizationId,
      organizationIdType: typeof user?.organizationId
    })

    // Create user if doesn't exist
    if (!user) {
      user = await User.create({
        email: session.user.email,
        name: session.user.name || '',
        image: session.user.image || '',
        clubs: [],
        adminOfClubs: [],
      })
    }

    // Type guard for populated organization
    const isPopulatedOrg = (org: any): org is { _id: any; name: string; logoUrl?: string } => {
      return org && typeof org === 'object' && 'name' in org
    }

    const organizationData = user.organizationId && isPopulatedOrg(user.organizationId)
      ? {
          id: user.organizationId._id.toString(),
          name: user.organizationId.name,
          logoUrl: user.organizationId.logoUrl,
        }
      : null

    console.log('[Profile API] Organization data:', organizationData)

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        phone: user.phone || '',
        bio: user.bio || '',
        organization: organizationData,
        clubs: user.clubs || [],
        adminOfClubs: user.adminOfClubs || [],
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('[Profile GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()
    const { name, phone, bio, image, organization } = body

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Update fields
    if (name) user.name = name
    if (phone !== undefined) user.phone = phone
    if (bio !== undefined) user.bio = bio
    if (image !== undefined) user.image = image
    if (organization !== undefined) user.organization = organization

    await user.save()

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        phone: user.phone,
        bio: user.bio,
        organization: user.organization,
      },
    })
  } catch (error) {
    console.error('[Profile PUT] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user account (optional, be careful with this)
export async function DELETE(request: NextRequest) {
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

    await user.deleteOne()

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    console.error('[Profile DELETE] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
