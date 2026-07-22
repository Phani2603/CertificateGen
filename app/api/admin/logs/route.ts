import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectDB from '@/lib/mongodb'
import AdminLog from '@/models/AdminLog'
import User from '@/models/User' // Ensure User model is registered
import { verifyAdminSessionValue } from '@/lib/admin-auth'

// Helper to check admin auth
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  return verifyAdminSessionValue(adminSession?.value)
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const action = searchParams.get('action') || ''

    const query: any = {}
    if (action) {
      query.action = { $regex: action, $options: 'i' }
    }

    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      AdminLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('adminId', 'name email')
        .lean(),
      AdminLog.countDocuments(query)
    ])

    console.log(`[Admin Logs API] Found ${total} logs, returning ${logs.length} for page ${page}`)

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    })
  } catch (error) {
    console.error('[Admin Logs API] Error fetching logs:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
