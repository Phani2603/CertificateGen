import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'
import Club from '@/models/Club'
import User from '@/models/User'
import Organization from '@/models/Organization'

// GET - Fetch clubs for user's organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    if (!user?.organizationId) {
      return NextResponse.json({ success: true, clubs: [], userClubs: [] })
    }

    // Get all clubs for the organization
    const clubs = await Club.find({ organizationId: user.organizationId })
      .populate('members', 'name email')
      .lean()

    // Get clubs user is a member of
    const userClubs = clubs.filter(club => 
      club.members.some((member: any) => member._id.toString() === user._id.toString())
    )

    return NextResponse.json({ 
      success: true, 
      clubs,
      userClubs: userClubs.map(c => c._id.toString()),
      organization: user.organizationId
    })
  } catch (error: any) {
    console.error('[Clubs API] GET error:', error)
    console.error('[Clubs API] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clubs', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or join club
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { action, clubId, name, description, color, logoUrl } = body

    const user = await User.findOne({ email: session.user.email })
    console.log('[Clubs API] User found:', {
      userId: user?._id,
      email: user?.email,
      hasOrganizationId: !!user?.organizationId,
      organizationId: user?.organizationId
    })
    
    if (!user?.organizationId) {
      return NextResponse.json({ success: false, error: 'Must join an organization first' }, { status: 400 })
    }

    if (action === 'join') {
      // Join existing club
      const club = await Club.findById(clubId)
      if (!club) {
        return NextResponse.json({ success: false, error: 'Club not found' }, { status: 404 })
      }

      // Add user to club members
      if (!club.members.includes(user._id)) {
        club.members.push(user._id)
        await club.save()
      }

      // Add club to user's clubs
      const userClubIds = user.clubs as mongoose.Types.ObjectId[]
      if (!userClubIds.some(id => id.toString() === club._id.toString())) {
        userClubIds.push(club._id)
        await user.save()
      }

      return NextResponse.json({ 
        success: true, 
        club,
        message: `Joined ${club.name} successfully`
      })
    } else if (action === 'create') {
      // Get the organization ID as ObjectId
      const orgId = typeof user.organizationId === 'object' && '_id' in user.organizationId 
        ? user.organizationId._id 
        : user.organizationId

      // Create new club
      const newClub = await Club.create({
        name,
        description,
        color: color || '#3B82F6',
        logoUrl,
        organizationId: orgId,
        createdBy: user._id,
        members: [user._id],
        admins: [user._id],
      })

      // Add club to user
      const userClubIds = user.clubs as mongoose.Types.ObjectId[]
      const userAdminClubIds = user.adminOfClubs as mongoose.Types.ObjectId[]
      userClubIds.push(newClub._id)
      userAdminClubIds.push(newClub._id)
      await user.save()

      // Add club to organization
      await Organization.findByIdAndUpdate(
        orgId,
        { $push: { clubs: newClub._id } }
      )

      return NextResponse.json({ 
        success: true, 
        club: newClub,
        message: `Created ${name} successfully`
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[Clubs API] POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// DELETE - Leave club
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get('clubId')

    if (!clubId) {
      return NextResponse.json({ success: false, error: 'Club ID required' }, { status: 400 })
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const club = await Club.findById(clubId)
    if (!club) {
      return NextResponse.json({ success: false, error: 'Club not found' }, { status: 404 })
    }

    // Remove user from club members
    club.members = club.members.filter((memberId: any) => memberId.toString() !== user._id.toString())
    await club.save()

    // Remove club from user's clubs
    const userClubIds = user.clubs as mongoose.Types.ObjectId[]
    user.clubs = userClubIds.filter(id => id.toString() !== clubId)
    await user.save()

    console.log('[Clubs API] User left club:', {
      userId: user._id,
      clubId,
      clubName: club.name
    })

    return NextResponse.json({
      success: true,
      message: `Left ${club.name} successfully`
    })
  } catch (error) {
    console.error('[Clubs API] DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to leave club' },
      { status: 500 }
    )
  }
}
