import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import AdminLog from '@/models/AdminLog'
import UserActivity from '@/models/UserActivity'

async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  return !!adminSession?.value
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

    const [adminLogs, activity] = await Promise.all([
      AdminLog.find({ targetType: 'user', targetId: objectId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      UserActivity.find({ userId: objectId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ])

    return NextResponse.json({ success: true, adminLogs, activity })
  } catch (error) {
    console.error('Error fetching user activity:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch activity' }, { status: 500 })
  }
}
