import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Organization from '@/models/Organization'
import Club from '@/models/Club'
import PrivateOrg from '@/models/PrivateOrg'

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
    
    // Ensure models are loaded (fix for Next.js cold starts)
    // This ensures mongoose knows about these models before populate
    if (!Organization || !Club || !PrivateOrg) {
      console.error('[Profile API] Model loading issue')
    }

    // First, fetch user without populate to check userType
    let user = await User.findOne({ email: session.user.email })

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

    // Now populate based on userType
    if (user.userType === 'individual' || user.userType === 'corporate') {
      // For individual/corporate users, populate privateOrgId if exists
      if (user.privateOrgId) {
        await user.populate('privateOrgId', 'name logoUrl slug allowedUsers')
      }
      
      // Clear old academic references for migrated users (cleanup)
      if (user.organizationId || user.clubs?.length) {
        console.log('[Profile API] Cleaning old academic data for individual/corporate user')
        user.organizationId = undefined
        user.clubs = []
        await user.save()
      }
    } else {
      // For academic users (or null userType), populate organizationId and clubs
      if (user.organizationId || user.clubs?.length) {
        await user.populate('organizationId', 'name logoUrl')
        await user.populate('clubs', 'name color logoUrl')
      }
    }

    console.log('[Profile API] User fetched:', {
      userId: user._id,
      email: user.email,
      userType: user.userType,
      hasOrganizationId: !!user.organizationId,
      hasPrivateOrgId: !!user.privateOrgId,
    })

    // Type guards for populated data
    const isPopulatedOrg = (org: any): org is { _id: any; name: string; logoUrl?: string } => {
      return org && typeof org === 'object' && 'name' in org
    }

    const isPopulatedPrivateOrg = (org: any): org is { _id: any; name: string; logoUrl?: string; slug: string; allowedUsers?: any[] } => {
      return org && typeof org === 'object' && 'name' in org && 'slug' in org
    }

    const organizationData = user.organizationId && isPopulatedOrg(user.organizationId)
      ? {
          id: user.organizationId._id.toString(),
          name: user.organizationId.name,
          logoUrl: user.organizationId.logoUrl,
        }
      : null

    const privateOrgData = user.privateOrgId && isPopulatedPrivateOrg(user.privateOrgId)
      ? {
          id: user.privateOrgId._id.toString(),
          name: user.privateOrgId.name,
          logoUrl: user.privateOrgId.logoUrl,
          slug: user.privateOrgId.slug,
          allowedUsers: user.privateOrgId.allowedUsers || [],
        }
      : null

    console.log('[Profile API] Organization data:', { organizationData, privateOrgData })

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        phone: user.phone || '',
        bio: user.bio || '',
        bannerColor: user.bannerColor || '#21808D',
        userType: user.userType,
        privateOrgId: user.privateOrgId ? user.privateOrgId.toString() : null,
        organization: organizationData,
        privateOrg: privateOrgData,
        clubs: user.clubs || [],
        adminOfClubs: user.adminOfClubs || [],
        createdAt: user.createdAt,
      },
    })
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    return response
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
    const { name, phone, bio, image, organization, userType, bannerColor } = body

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
    if (bannerColor !== undefined) user.bannerColor = bannerColor
    
    // Restrict userType updates - corporate requires admin approval
    // Only allow individual or academic for regular users
    if (userType && !user.userType) {
      // First-time setup: only allow 'individual' or 'academic'
      // 'corporate' can only be set by admin
      if (userType === 'corporate') {
        return NextResponse.json(
          { success: false, error: 'Corporate account type requires admin approval. Please contact our team.' },
          { status: 403 }
        )
      }
      
      if (['individual', 'academic'].includes(userType)) {
        user.userType = userType
      }
    }

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
        bannerColor: user.bannerColor,
        userType: user.userType,
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

// PATCH - Update specific fields (alias for PUT in this case, but good practice to have)
export async function PATCH(request: NextRequest) {
  return PUT(request)
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
