import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import PrivateOrg from '@/models/PrivateOrg'
import User from '@/models/User'
import { auth } from '@/auth'

// GET all organizations for the current user
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

    const user = await User.findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Find organizations where user is owner or in allowedUsers
    const organizations = await PrivateOrg.find({
      $or: [
        { ownerId: user._id },
        { allowedUsers: user._id }
      ]
    })
      .select('name slug description logoUrl isPublic ownerId createdAt')
      .lean()

    return NextResponse.json({
      success: true,
      organizations,
    })
  } catch (error) {
    console.error('[Private Orgs] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch organizations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST create a new organization
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

    if (user.userType !== 'corporate') {
      return NextResponse.json(
        { success: false, error: 'Only corporate users can create organizations' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, website, isPublic } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Organization name is required' },
        { status: 400 }
      )
    }

    // Generate unique slug
    const slug = await PrivateOrg.generateSlug(name)

    // Create organization
    const organization = await PrivateOrg.create({
      name,
      slug,
      description,
      website,
      isPublic: isPublic || false,
      ownerId: user._id,
      allowedUsers: [user._id],
    })

    // Update user's privateOrgId
    user.privateOrgId = organization._id
    await user.save()

    return NextResponse.json({
      success: true,
      organization: {
        _id: organization._id,
        name: organization.name,
        slug: organization.slug,
      },
    })
  } catch (error) {
    console.error('[Private Orgs Create] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create organization',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
