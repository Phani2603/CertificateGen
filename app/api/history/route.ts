import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import CertificateHistory from '@/models/CertificateHistory'
import User from '@/models/User'
import Event from '@/models/Event'
import Club from '@/models/Club'

// GET - Fetch certificate generation history with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const privateOrgId = searchParams.get('privateOrgId')
    const skip = (page - 1) * limit

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    let query: any = { userId: user._id }
    
    if (privateOrgId) {
      // If privateOrgId is provided, fetch history for that org (if user is owner/member)
      // For now, let's just filter by privateOrgId
      query = { privateOrgId }
    }

    // Get total count for pagination
    const total = await CertificateHistory.countDocuments(query)

    // Get paginated history (populate will be null if ref doesn't exist)
    const history = await CertificateHistory.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Try to populate but don't fail if refs are missing
    try {
      await CertificateHistory.populate(history, [
        { path: 'eventId', select: 'name date' },
        { path: 'clubId', select: 'name color' }
      ])
    } catch (populateError) {
      console.warn('[History API] Populate warning:', populateError)
      // Continue without populated data
    }

    const formattedHistory = history.map(item => ({
      id: item._id.toString(),
      eventName: item.eventName,
      clubName: item.clubName,
      certificateCount: item.certificateCount,
      date: item.createdAt.toISOString().split('T')[0],
      timestamp: item.createdAt.getTime(),
      successRate: item.successRate,
      totalSize: formatBytes(item.totalSize),
      batchId: item.batchId,
    }))

    return NextResponse.json({
      success: true,
      history: formattedHistory,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      }
    })
  } catch (error) {
    console.error('[History API] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}

// POST - Add history entry (called after certificate generation)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { eventId, eventName, clubId, clubName, certificateCount, totalSize, batchId, certificateIds, privateOrgId } = body

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Get the organization ID as ObjectId
    const orgId = typeof user.organizationId === 'object' && '_id' in user.organizationId 
      ? user.organizationId._id 
      : user.organizationId

    const historyEntry = await CertificateHistory.create({
      eventId,
      eventName,
      clubId,
      clubName,
      organizationId: orgId,
      privateOrgId,
      userId: user._id,
      certificateCount,
      totalSize,
      successRate: 100,
      batchId,
      certificateIds: certificateIds || [],
    })

    return NextResponse.json({
      success: true,
      history: historyEntry,
      message: 'History entry created successfully'
    })
  } catch (error) {
    console.error('[History API] POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create history entry' },
      { status: 500 }
    )
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
