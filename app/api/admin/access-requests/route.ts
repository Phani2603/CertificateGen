import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectDB from '@/lib/mongodb'
import AccessRequest from '@/models/AccessRequest'
import User from '@/models/User'
import AdminLog from '@/models/AdminLog'

// Helper to check admin auth
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  return !!adminSession?.value
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const requests = await AccessRequest.find({ status: 'pending' })
      .populate('userId', 'name email image userType')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      requests
    })
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch requests' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await request.json()
    const { requestId, status, adminId } = body // adminId is optional, we can use a placeholder

    if (!['approved', 'denied'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
    }

    const accessRequest = await AccessRequest.findById(requestId)
    if (!accessRequest) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
    }

    accessRequest.status = status
    accessRequest.reviewedAt = new Date()
    // In a real app, we'd get the admin ID from the session, but here we use a placeholder or the first admin user
    // accessRequest.reviewedBy = ... 

    await accessRequest.save()

    if (status === 'approved') {
      // Update user type
      await User.findByIdAndUpdate(accessRequest.userId, {
        userType: accessRequest.requestedType
      })
    }

    // Log action
    await AdminLog.create({
      adminId: null, // System action or placeholder
      adminEmail: process.env.ADMIN_EMAIL || 'admin@system.local',
      action: `Access Request ${status}`,
      targetType: 'AccessRequest',
      targetId: requestId,
      details: { requestedType: accessRequest.requestedType, userId: accessRequest.userId },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating request:', error)
    return NextResponse.json({ success: false, error: 'Failed to update request' }, { status: 500 })
  }
}
