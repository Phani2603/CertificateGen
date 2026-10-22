import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import CertificateHistory from '@/models/CertificateHistory'
import Certificate from '@/models/Certificate'
import EmailJob from '@/models/EmailJob'
import { verifyAdminSessionValue } from '@/lib/admin-auth'

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Helper to check admin auth
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  return verifyAdminSessionValue(adminSession?.value)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; historyId: string }> }
) {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin session required' }, { status: 401 })
    }

    const { id: orgId, historyId } = await params
    const cleanOrgId = orgId.trim()
    const cleanHistoryId = historyId.trim()

    if (!mongoose.Types.ObjectId.isValid(cleanHistoryId)) {
      return NextResponse.json({ success: false, error: 'Invalid history ID' }, { status: 400 })
    }

    await connectDB()

    const history = await CertificateHistory.findById(cleanHistoryId).lean()
    if (!history) {
      return NextResponse.json({ success: false, error: 'Certificate history not found' }, { status: 404 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const rawPage = Number.parseInt(searchParams.get('page') || '1', 10)
    const rawLimit = Number.parseInt(searchParams.get('limit') || '50', 10)
    const q = (searchParams.get('q') || '').trim()
    const statusFilter = (searchParams.get('status') || 'all').toLowerCase().trim()
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1

    const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage
    const limit = Number.isNaN(rawLimit) ? 50 : Math.min(Math.max(rawLimit, 1), 200)
    const skip = (page - 1) * limit

    // Determine batch IDs
    const registrationBatchIds = Array.isArray(history.registrationBatchIds) && history.registrationBatchIds.length > 0
      ? history.registrationBatchIds
      : (history.batchId ? [history.batchId] : [])

    let baseQuery: any = {}
    if (registrationBatchIds.length > 0) {
      baseQuery = { "metadata.batchId": { $in: registrationBatchIds } }
    } else if (history.certificateIds && history.certificateIds.length > 0) {
      baseQuery = { _id: { $in: history.certificateIds } }
    } else {
      return NextResponse.json({
        success: true,
        history: {
          id: cleanHistoryId,
          eventName: history.eventName,
          batchId: history.batchId,
          createdAt: history.createdAt,
        },
        participants: [],
        csvHeaders: [],
        emailStatusCounts: { sent: 0, pending: 0, failed: 0, none: 0, total: 0 },
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: false,
        },
      })
    }

    // Build search query if user provided q
    const query = { ...baseQuery }
    if (q) {
      const regex = new RegExp(escapeRegex(q), 'i')
      query.$or = [
        { recipientName: regex },
        { recipientEmail: regex },
        { verificationId: regex },
      ]
    }

    // Calculate overall email stats for this batch across all certificates
    const allBatchJobs = await EmailJob.find({
      batchId: { $in: registrationBatchIds },
      type: 'certificate_notification'
    }).select('status certificateId lastError').lean()

    const emailStatusCounts = {
      sent: 0,
      pending: 0,
      failed: 0,
      none: 0,
      total: 0,
    }

    const emailJobMap = new Map<string, { status: string; lastError?: string }>()
    allBatchJobs.forEach((job: any) => {
      const certIdStr = job.certificateId?.toString()
      if (certIdStr) {
        emailJobMap.set(certIdStr, {
          status: job.status,
          lastError: job.lastError,
        })
      }
      if (job.status === 'sent') emailStatusCounts.sent++
      else if (job.status === 'failed') emailStatusCounts.failed++
      else emailStatusCounts.pending++
    })

    const totalBatchCerts = await Certificate.countDocuments(baseQuery)
    emailStatusCounts.total = totalBatchCerts
    emailStatusCounts.none = Math.max(0, totalBatchCerts - (emailStatusCounts.sent + emailStatusCounts.pending + emailStatusCounts.failed))

    // Handle email status filtering
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'failed' || statusFilter === 'sent' || statusFilter === 'pending') {
        const matchingJobCertIds = allBatchJobs
          .filter((job: any) => {
            if (statusFilter === 'pending') {
              return job.status === 'pending' || job.status === 'sending'
            }
            return job.status === statusFilter
          })
          .map((job: any) => job.certificateId)
        query._id = { $in: matchingJobCertIds }
      } else if (statusFilter === 'none') {
        const certIdsWithJobs = allBatchJobs.map((j: any) => j.certificateId)
        query._id = { $nin: certIdsWithJobs }
      }
    }

    // Sorting
    const sortMap: Record<string, any> = {
      date: { issueDate: sortOrder, _id: sortOrder },
      name: { recipientName: sortOrder, _id: sortOrder },
      email: { recipientEmail: sortOrder, _id: sortOrder },
    }
    const sort = sortMap[sortBy] || sortMap.date

    const totalMatching = await Certificate.countDocuments(query)
    const certificates = await Certificate.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()

    // Sample dynamic CSV headers from the batch certificates
    // Sample first 100 certificates in the batch to detect all unique resolvedFieldValues keys
    const sampleCerts = await Certificate.find(baseQuery)
      .select('resolvedFieldValues')
      .limit(100)
      .lean()

    const detectedCsvHeaderSet = new Set<string>()
    sampleCerts.forEach((c: any) => {
      if (c.resolvedFieldValues && typeof c.resolvedFieldValues === 'object') {
        Object.keys(c.resolvedFieldValues).forEach((key) => {
          // Exclude internal keys if any, trim
          const cleanKey = key.trim()
          if (cleanKey && cleanKey !== '_id' && cleanKey !== '__v') {
            detectedCsvHeaderSet.add(cleanKey)
          }
        })
      }
    })
    const csvHeaders = Array.from(detectedCsvHeaderSet)

    const participants = certificates.map((cert: any) => {
      const emailJob = emailJobMap.get(cert._id.toString())
      return {
        id: cert._id.toString(),
        recipientName: cert.recipientName || '',
        recipientEmail: cert.recipientEmail || '',
        verificationId: cert.verificationId,
        issuedAt: cert.issueDate ? new Date(cert.issueDate).toISOString() : null,
        batchId: cert.metadata?.batchId || null,
        templateS3Key: cert.templateS3Key || null,
        resolvedFieldValues: cert.resolvedFieldValues || {},
        emailStatus: emailJob?.status || 'none',
        emailError: emailJob?.lastError || null,
        isValid: cert.isValid ?? true,
      }
    })

    return NextResponse.json({
      success: true,
      history: {
        id: cleanHistoryId,
        eventName: history.eventName,
        clubName: history.clubName,
        certificateCount: history.certificateCount,
        batchId: history.batchId,
        createdAt: history.createdAt,
      },
      csvHeaders,
      emailStatusCounts,
      participants,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMatching / limit),
        totalItems: totalMatching,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalMatching / limit),
        hasPrevPage: page > 1,
      },
    })
  } catch (error) {
    console.error('[Admin History Participants API] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch batch participants' },
      { status: 500 }
    )
  }
}
