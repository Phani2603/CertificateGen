import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import Event from '@/models/Event'
import Club from '@/models/Club'
import User from '@/models/User'

// GET - Fetch events for user's clubs
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const clubId = searchParams.get('clubId')
    const privateOrgId = searchParams.get('privateOrgId')

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    let query: any = {}
    
    if (privateOrgId) {
      // Fetch events for a specific private organization
      query.privateOrgId = privateOrgId
    } else if (clubId) {
      // When clubId is specified, fetch ALL events for that club (not filtered by user membership)
      // This allows users to see all club events when viewing club details
      query.clubId = clubId
    } else if (user.clubs.length > 0) {
      // When no clubId specified, show only events from clubs user is a member of
      query.clubId = { $in: user.clubs }
    } else {
      return NextResponse.json({ success: true, events: {} })
    }

    const events = await Event.find(query)
      .populate('clubId', 'name color')
      .populate('privateOrgId', 'name')
      .sort({ date: -1 })
      .lean()

    // If fetching for private org, return flat list
    if (privateOrgId) {
      return NextResponse.json({ success: true, events })
    }

    // Group by club
    const eventsByClub: Record<string, any[]> = {}
    events.forEach(event => {
      // Skip events without clubId when grouping by club
      if (!event.clubId) return

      const clubKey = event.clubId._id.toString()
      if (!eventsByClub[clubKey]) {
        eventsByClub[clubKey] = []
      }
      eventsByClub[clubKey].push({
        id: event._id.toString(),
        name: event.name,
        description: event.description,
        date: event.date,
        certificatesGenerated: event.certificatesGenerated,
      })
    })

    return NextResponse.json({ success: true, events: eventsByClub })
  } catch (error) {
    console.error('[Events API] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

// POST - Create event
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { clubId, privateOrgId, name, description, date } = body

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Handle private organization events
    if (privateOrgId) {
      const PrivateOrg = (await import('@/models/PrivateOrg')).default
      const privateOrg = await PrivateOrg.findById(privateOrgId)
      
      if (!privateOrg) {
        return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 })
      }

      // Check if user has access (owner or member)
      const isOwner = privateOrg.ownerId.toString() === user._id.toString()
      const isMember = privateOrg.allowedUsers.includes(user._id)

      if (!isOwner && !isMember) {
        return NextResponse.json({ success: false, error: 'Not authorized to create events for this organization' }, { status: 403 })
      }

      const newEvent = await Event.create({
        name,
        description,
        date: new Date(date),
        privateOrgId: privateOrg._id,
        createdBy: user._id,
      })

      return NextResponse.json({ 
        success: true, 
        event: newEvent,
        message: `Created event ${name} successfully`
      })
    }

    // Handle club events (existing logic)
    if (!clubId) {
      return NextResponse.json({ success: false, error: 'Club ID or Organization ID is required' }, { status: 400 })
    }

    // Verify user is member of the club
    if (!user.clubs.includes(clubId)) {
      return NextResponse.json({ success: false, error: 'Not a member of this club' }, { status: 403 })
    }

    const club = await Club.findById(clubId)
    if (!club) {
      return NextResponse.json({ success: false, error: 'Club not found' }, { status: 404 })
    }

    const newEvent = await Event.create({
      name,
      description,
      date: new Date(date),
      clubId: club._id,
      organizationId: club.organizationId,
      createdBy: user._id,
    })

    // Add event to club
    club.events.push(newEvent._id)
    await club.save()

    return NextResponse.json({ 
      success: true, 
      event: newEvent,
      message: `Created event ${name} successfully`
    })
  } catch (error) {
    console.error('[Events API] POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
