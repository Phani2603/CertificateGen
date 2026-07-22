import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import AdminLog from '@/models/AdminLog'
import UserActivity from '@/models/UserActivity'
import Organization from '@/models/Organization'
import PrivateOrg from '@/models/PrivateOrg'
import Event from '@/models/Event'
import CertificateHistory from '@/models/CertificateHistory'
import { verifyAdminSessionValue } from '@/lib/admin-auth'

async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  return verifyAdminSessionValue(adminSession?.value)
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params
    const objectId = new mongoose.Types.ObjectId(id)

    const [adminLogs, activity, orgsCreated, orgsJoined, corpOwned, corpMember, eventsCreated, certHistory] = await Promise.all([
      AdminLog.find({ targetType: 'user', targetId: objectId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      UserActivity.find({ userId: objectId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Organization.find({ createdBy: objectId }).lean(),
      Organization.find({ members: objectId }).lean(),
      PrivateOrg.find({ ownerId: objectId }).lean(),
      PrivateOrg.find({ allowedUsers: objectId }).lean(),
      Event.find({ createdBy: objectId }).sort({ createdAt: -1 }).limit(50).lean(),
      CertificateHistory.find({ userId: objectId }).sort({ createdAt: -1 }).limit(50).lean(),
    ])

    const activityExtras = [
      ...orgsCreated.map(org => ({
        action: 'created_academic_org',
        description: org.name,
        category: 'organization',
        createdAt: org.createdAt,
        meta: { organizationId: org._id, type: org.type },
        source: 'user' as const,
      })),
      ...orgsJoined
        .filter(org => !orgsCreated.some(o => o._id.toString() === org._id.toString()))
        .map(org => ({
          action: 'joined_academic_org',
          description: org.name,
          category: 'organization',
          createdAt: org.createdAt,
          meta: { organizationId: org._id, type: org.type },
          source: 'user' as const,
        })),
      ...corpOwned.map(org => ({
        action: 'created_corporate_org',
        description: org.name,
        category: 'corporate_org',
        createdAt: org.createdAt,
        meta: { organizationId: org._id, slug: org.slug },
        source: 'user' as const,
      })),
      ...corpMember
        .filter(org => !corpOwned.some(o => o._id.toString() === org._id.toString()))
        .map(org => ({
          action: 'joined_corporate_org',
          description: org.name,
          category: 'corporate_org',
          createdAt: org.createdAt,
          meta: { organizationId: org._id, slug: org.slug },
          source: 'user' as const,
        })),
      ...eventsCreated.map(ev => ({
        action: 'created_event',
        description: ev.name,
        category: 'event',
        createdAt: ev.createdAt,
        meta: { eventId: ev._id, date: ev.date },
        source: 'user' as const,
      })),
      ...certHistory.map(hist => ({
        action: 'generated_certificates',
        description: `${hist.certificateCount} certificates for ${hist.eventName}`,
        category: 'certificates',
        createdAt: hist.createdAt,
        meta: { eventId: hist.eventId, count: hist.certificateCount, batchId: hist.batchId },
        source: 'user' as const,
      })),
    ]

    const combinedActivity = [...adminLogs.map(log => ({
      _id: log._id,
      action: log.action,
      description: log.details?.description || log.details?.message,
      actorEmail: log.adminEmail,
      createdAt: log.createdAt,
      meta: log.details,
      source: 'admin' as const,
    })),
    ...activity.map(item => ({
      _id: item._id,
      action: item.action,
      description: item.description,
      category: item.category,
      actorEmail: item.actorEmail,
      createdAt: item.createdAt,
      meta: item.meta,
      source: item.actorType === 'admin' ? 'admin' : 'user' as const,
    })),
    ...activityExtras]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100)

    const summaries = {
      orgs: {
        academicCreated: orgsCreated.length,
        academicJoined: orgsJoined.length,
        corporateOwned: corpOwned.length,
        corporateMember: corpMember.length,
        lastOrg: [...orgsCreated, ...orgsJoined, ...corpOwned, ...corpMember]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.name || null,
      },
      events: {
        createdCount: eventsCreated.length,
        lastEvent: eventsCreated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.name || null,
      },
      certificates: {
        batches: certHistory.length,
        totalGenerated: certHistory.reduce((sum, h) => sum + (h.certificateCount || 0), 0),
        lastBatch: certHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.eventName || null,
      }
    }

    return NextResponse.json({ success: true, adminLogs, activity: combinedActivity, summaries })
  } catch (error) {
    console.error('Error fetching user activity:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch activity' }, { status: 500 })
  }
}
