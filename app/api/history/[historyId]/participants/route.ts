import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import PrivateOrg from '@/models/PrivateOrg'
import CertificateHistory from '@/models/CertificateHistory'
import Certificate from '@/models/Certificate'

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ historyId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { historyId } = await params
    if (!mongoose.Types.ObjectId.isValid(historyId)) {
      return NextResponse.json({ success: false, error: 'Invalid history id' }, { status: 400 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const rawPage = Number.parseInt(searchParams.get('page') || '1', 10)
    const rawLimit = Number.parseInt(searchParams.get('limit') || '20', 10)
    const q = (searchParams.get('q') || '').toLowerCase().trim()
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1

    const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage
    const limit = Number.isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 100)
    const skip = (page - 1) * limit

    const user = await User.findOne({ email: session.user.email }).select('_id').lean()
    if (!user?._id) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const history = await CertificateHistory.findById(historyId)
      .select('privateOrgId eventName batchId registrationBatchIds createdAt')
      .lean()

    if (!history) {
      return NextResponse.json({ success: false, error: 'History entry not found' }, { status: 404 })
    }

    if (!history.privateOrgId) {
      return NextResponse.json({ success: false, error: 'Participants are only available for corporate history' }, { status: 400 })
    }

    const org = await PrivateOrg.findById(history.privateOrgId)
      .select('ownerId allowedUsers')
      .lean()

    if (!org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 })
    }

    const userId = String(user._id)
    const hasAccess = String(org.ownerId) === userId || (org.allowedUsers || []).some((id: any) => String(id) === userId)

    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const registrationBatchIds = Array.isArray(history.registrationBatchIds) && history.registrationBatchIds.length > 0
      ? history.registrationBatchIds
      : (history.batchId ? [history.batchId] : [])

    if (registrationBatchIds.length === 0) {
      return NextResponse.json({
        success: true,
        participants: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: false,
        },
      })
    }

    const query: any = { "metadata.batchId": { $in: registrationBatchIds } }

    if (q) {
      const prefix = new RegExp(`^${escapeRegex(q)}`)
      query.$or = [
        { recipientNameLower: prefix },
        { recipientEmailLower: prefix },
      ]
    }

    const sortMap: Record<string, any> = {
      date: { issueDate: sortOrder, _id: sortOrder },
      name: { recipientNameLower: sortOrder, _id: sortOrder },
      email: { recipientEmailLower: sortOrder, _id: sortOrder },
    }
    const sort = sortMap[sortBy] || sortMap.date

    let total = await Certificate.countDocuments(query)
    let participants = await Certificate.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('recipientName recipientEmail verificationId issueDate metadata.batchId')
      .lean()

    // Fallback for old certificates that may not yet have normalized fields.
    if (q && total === 0) {
      const fallbackPrefix = new RegExp(`^${escapeRegex(q)}`, 'i')
      const fallbackQuery = {
        "metadata.batchId": { $in: registrationBatchIds },
        $or: [
          { recipientName: fallbackPrefix },
          { recipientEmail: fallbackPrefix },
        ],
      }

      total = await Certificate.countDocuments(fallbackQuery)
      participants = await Certificate.find(fallbackQuery)
        .sort({ issueDate: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .select('recipientName recipientEmail verificationId issueDate metadata.batchId')
        .lean()
    }

    return NextResponse.json({
      success: true,
      history: {
        id: historyId,
        eventName: history.eventName,
      },
      participants: participants.map((item: any) => ({
        id: item._id.toString(),
        recipientName: item.recipientName,
        recipientEmail: item.recipientEmail,
        verificationId: item.verificationId,
        issuedAt: item.issueDate,
        batchId: item.metadata?.batchId || null,
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    })
  } catch (error) {
    console.error('[History Participants API] GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch participants' }, { status: 500 })
  }
}
