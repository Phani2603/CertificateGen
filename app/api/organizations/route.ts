import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import Organization from '@/models/Organization'
import User from '@/models/User'

// GET - Fetch user's organization or search organizations
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const type = searchParams.get('type')

    // If searching or listing by type, return matching organizations
    if (search !== null || type) {
      const query: any = {}
      
      if (search && search.trim()) {
        query.name = { $regex: search, $options: 'i' }
      }
      if (type) {
        query.type = type
      }

      const organizations = await Organization.find(query)
        .select('name type city state logoUrl nirfRank')
        .sort({ nirfRank: 1, name: 1 }) // Sort by rank first, then name
        .limit(search && search.trim() ? 100 : 500) // Return 100 for search, 500 for listing
        .lean()

      return NextResponse.json({ success: true, organizations })
    }

    // Get user's organization
    const user = await User.findOne({ email: session.user.email }).populate('organizationId')
    
    if (!user?.organizationId) {
      return NextResponse.json({ success: true, organization: null })
    }

    return NextResponse.json({ 
      success: true, 
      organization: user.organizationId 
    })
  } catch (error: any) {
    console.error('[Organizations API] GET error:', error)
    console.error('[Organizations API] GET error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch organizations', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or join organization
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { action, organizationId, name, type, city, state, website, description, logoUrl } = body

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (action === 'join') {
      // Join existing organization
      const organization = await Organization.findById(organizationId)
      if (!organization) {
        return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 })
      }

      // Update user
      user.organizationId = organization._id
      await user.save()
      console.log('[Organizations API] User joined organization:', {
        userId: user._id,
        organizationId: organization._id,
        organizationName: organization.name
      })

      // Add user to organization members
      if (!organization.members.includes(user._id)) {
        organization.members.push(user._id)
        await organization.save()
      }

      return NextResponse.json({ 
        success: true, 
        organization,
        message: `Joined ${organization.name} successfully`
      })
    } else if (action === 'create') {
      // Create new organization
      const newOrganization = await Organization.create({
        name,
        type,
        city,
        state,
        website,
        description,
        logoUrl,
        createdBy: user._id,
        members: [user._id],
      })

      // Update user
      user.organizationId = newOrganization._id
      await user.save()
      console.log('[Organizations API] User created organization:', {
        userId: user._id,
        organizationId: newOrganization._id,
        organizationName: newOrganization.name
      })

      return NextResponse.json({ 
        success: true, 
        organization: newOrganization,
        message: `Created ${name} successfully`
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('[Organizations API] POST error:', error)
    console.error('[Organizations API] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { success: false, error: 'Failed to process request', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Leave organization
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user || !user.organizationId) {
      return NextResponse.json({ success: false, error: 'No organization to leave' }, { status: 400 })
    }

    const organizationId = typeof user.organizationId === 'object' && '_id' in user.organizationId
      ? user.organizationId._id
      : user.organizationId

    // Remove user from organization members
    await Organization.findByIdAndUpdate(organizationId, {
      $pull: { members: user._id }
    })

    // Remove organization from user
    user.organizationId = undefined
    await user.save()

    console.log('[Organizations API] User left organization:', {
      userId: user._id,
      organizationId
    })

    return NextResponse.json({
      success: true,
      message: 'Left organization successfully'
    })
  } catch (error) {
    console.error('[Organizations API] DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to leave organization' },
      { status: 500 }
    )
  }
}

// PATCH - Update organization
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { organizationId, name, description, logoUrl, website } = body

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const organization = await Organization.findById(organizationId)
    if (!organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 })
    }

    // Check if user is creator
    if (organization.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json({ success: false, error: 'Not authorized to update' }, { status: 403 })
    }

    // Update organization
    if (name) organization.name = name
    if (description !== undefined) organization.description = description
    if (logoUrl !== undefined) organization.logoUrl = logoUrl
    if (website !== undefined) organization.website = website

    await organization.save()

    return NextResponse.json({ 
      success: true, 
      organization,
      message: 'Organization updated successfully'
    })
  } catch (error) {
    console.error('[Organizations API] PATCH error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update organization' },
      { status: 500 }
    )
  }
}
