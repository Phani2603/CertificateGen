import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Organization from '@/models/Organization'
import PrivateOrg from '@/models/PrivateOrg'
import User from '@/models/User'
import Event from '@/models/Event'
import CertificateHistory from '@/models/CertificateHistory'
import Invitation from '@/models/Invitation'
import { verifyAdminSessionValue } from '@/lib/admin-auth'

// Helper to check admin auth
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  return verifyAdminSessionValue(adminSession?.value)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params
    const cleanId = id.trim()

    if (!mongoose.Types.ObjectId.isValid(cleanId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 })
    }

    // Try to find in both collections
    let org: any = null
    let orgType: 'academic' | 'corporate' = 'academic'

    // Check PrivateOrg (corporate) first since the current UI only shows "View Dashboard" for corporate
    org = await PrivateOrg.findById(cleanId).lean()
    if (org) {
      orgType = 'corporate'
    } else {
      // Check academic Organization
      org = await Organization.findById(cleanId).lean()
      if (org) {
        orgType = 'academic'
      }
    }

    if (!org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 })
    }

    // Fetch owner details
    let owner = null
    const ownerId = orgType === 'corporate' ? org.ownerId : org.createdBy
    if (ownerId) {
      owner = await User.findById(ownerId)
        .select('name email image userType provider createdAt isSuspended isBlocked')
        .lean()
      if (owner) {
        owner = { ...owner, _id: owner._id.toString() }
      }
    }

    // Fetch members
    let members: any[] = []
    const memberIds = orgType === 'corporate' ? org.allowedUsers : org.members
    if (memberIds && memberIds.length > 0) {
      members = await User.find({ _id: { $in: memberIds } })
        .select('name email image userType provider createdAt')
        .lean()
      members = members.map(m => ({ ...m, _id: m._id.toString() }))
    }

    // Fetch events
    let events: any[] = []
    const eventQuery = orgType === 'corporate'
      ? { privateOrgId: new mongoose.Types.ObjectId(cleanId) }
      : { organizationId: new mongoose.Types.ObjectId(cleanId) }

    events = await Event.find(eventQuery)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
    events = events.map(e => ({
      ...e,
      _id: e._id.toString(),
      createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : null,
      date: e.date ? new Date(e.date).toISOString() : null,
    }))

    // Fetch certificate history
    let certificateHistory: any[] = []
    const historyQuery = orgType === 'corporate'
      ? { privateOrgId: new mongoose.Types.ObjectId(cleanId) }
      : { organizationId: new mongoose.Types.ObjectId(cleanId) }

    certificateHistory = await CertificateHistory.find(historyQuery)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
    certificateHistory = certificateHistory.map(h => ({
      ...h,
      _id: h._id.toString(),
      eventId: h.eventId ? h.eventId.toString() : null,
      createdAt: h.createdAt ? new Date(h.createdAt).toISOString() : null,
    }))

    // Calculate live certificate counts per event from history
    const eventHistoryCounts = new Map<string, number>()
    certificateHistory.forEach(h => {
      if (h.eventId) {
        eventHistoryCounts.set(h.eventId, (eventHistoryCounts.get(h.eventId) || 0) + (h.certificateCount || 0))
      }
    })

    events = events.map(e => ({
      ...e,
      _id: e._id.toString(),
      createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : null,
      date: e.date ? new Date(e.date).toISOString() : null,
      liveCertificateCount: eventHistoryCounts.get(e._id.toString()) ?? (e.certificatesGenerated || 0),
    }))

    // Fetch invitations (corporate only)
    let invitations: any[] = []
    if (orgType === 'corporate') {
      invitations = await Invitation.find({ privateOrgId: new mongoose.Types.ObjectId(cleanId) })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
      invitations = invitations.map(inv => ({
        ...inv,
        _id: inv._id.toString(),
        createdAt: inv.createdAt ? new Date(inv.createdAt).toISOString() : null,
        expiresAt: inv.expiresAt ? new Date(inv.expiresAt).toISOString() : null,
        acceptedAt: inv.acceptedAt ? new Date(inv.acceptedAt).toISOString() : null,
      }))
    }

    // Compute stats
    const totalCertificates = certificateHistory.reduce(
      (sum: number, h: any) => sum + (h.certificateCount || 0), 0
    )
    const totalEvents = events.length

    // Quota info (corporate only)
    let quotaInfo = null
    if (orgType === 'corporate') {
      quotaInfo = {
        certificateQuota: org.certificateQuota ?? 0,
        certificatesUsed: org.certificatesUsed ?? 0,
        remaining: org.certificateQuota === -1
          ? 'Unlimited'
          : Math.max(0, (org.certificateQuota ?? 0) - (org.certificatesUsed ?? 0)),
        isUnlimited: org.certificateQuota === -1,
        watermarkDisabledByAdmin: org.watermarkDisabledByAdmin ?? false,
      }
    }

    return NextResponse.json({
      success: true,
      organization: {
        ...org,
        _id: org._id.toString(),
        createdAt: org.createdAt ? new Date(org.createdAt).toISOString() : null,
        updatedAt: org.updatedAt ? new Date(org.updatedAt).toISOString() : null,
      },
      orgType,
      owner,
      members,
      events,
      certificateHistory,
      invitations,
      stats: {
        totalMembers: members.length,
        totalEvents,
        totalCertificates,
      },
      quotaInfo,
    })
  } catch (error) {
    console.error('Error fetching organization view data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch organization data' },
      { status: 500 }
    )
  }
}
