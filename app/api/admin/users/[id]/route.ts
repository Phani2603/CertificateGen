import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Organization from '@/models/Organization'
import PrivateOrg from '@/models/PrivateOrg'
import Club from '@/models/Club'
import CertificateHistory from '@/models/CertificateHistory'
import Event from '@/models/Event'
import AdminLog from '@/models/AdminLog'

// Helper to check admin auth
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  return !!adminSession?.value
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

    // Ensure models are loaded
    if (!Organization || !Club || !PrivateOrg) {
      console.error('[Admin User Details] Model loading issue')
    }

    const user = await User.findById(id)
      .select('-password')
      .populate('organizationId', 'name logoUrl')
      .populate('privateOrgId', 'name slug logoUrl')
      .populate('clubs', 'name color')
      .populate('adminOfClubs', 'name')
      .lean()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Fetch additional stats
    const [certificateStats, eventStats] = await Promise.all([
      CertificateHistory.aggregate([
        { $match: { generatedBy: user._id } },
        { $group: { _id: null, total: { $sum: '$certificateCount' } } }
      ]),
      Event.countDocuments({ createdBy: user._id })
    ])

    const totalCertificates = certificateStats[0]?.total || 0
    const totalEvents = eventStats || 0

    // Get last activity
    const lastActivity = await CertificateHistory.findOne({ generatedBy: user._id })
      .sort({ createdAt: -1 })
      .select('createdAt')
      .lean()

    return NextResponse.json({ 
      success: true, 
      user: {
        ...user,
        totalCertificates,
        totalEvents,
        lastActivity: lastActivity ? new Date(lastActivity.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : null,
      }
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PATCH(
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
    const body = await request.json()

    const user = await User.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).select('-password')
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Log action
    await AdminLog.create({
      adminId: null,
      adminEmail: process.env.ADMIN_EMAIL || 'admin@system.local',
      action: 'Update User',
      targetType: 'User',
      targetId: id,
      details: { updates: body },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
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

    const user = await User.findByIdAndDelete(id)
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Log action
    await AdminLog.create({
      adminId: null,
      adminEmail: process.env.ADMIN_EMAIL || 'admin@system.local',
      action: 'Delete User',
      targetType: 'User',
      targetId: id,
      details: { email: user.email, name: user.name },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete user' 
    }, { status: 500 })
  }
}
