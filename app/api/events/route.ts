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

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    let query: any = {}
    
    if (clubId) {
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
      .sort({ date: -1 })
      .lean()

    // Group by club
    const eventsByClub: Record<string, any[]> = {}
    events.forEach(event => {
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
    const { clubId, name, description, date } = body

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
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
