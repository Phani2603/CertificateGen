import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import UserActivity from '@/models/UserActivity'
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

    const sessionEvents = await UserActivity.find({
      userId: objectId,
      action: { $in: ['session_login', 'session_logout', 'session_revoked', 'session_expired'] },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    return NextResponse.json({ success: true, sessions: sessionEvents })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
