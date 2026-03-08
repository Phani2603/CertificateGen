import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectDB from '@/lib/mongodb'
import PrivateOrg from '@/models/PrivateOrg'

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
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    await connectDB()

    // Fetch all private organizations with quota information
    const organizations = await PrivateOrg.find({})
      .select('name slug certificateQuota certificatesUsed allowedUsers ownerId createdAt updatedAt')
      .populate('ownerId', 'name email')
      .lean()
      .sort({ createdAt: -1 })

    console.log('[API /admin/organizations/list] Found organizations:', organizations.length)
    console.log('[API /admin/organizations/list] Organizations:', JSON.stringify(organizations, null, 2))

    return NextResponse.json({
      success: true,
      organizations,
      count: organizations.length,
    })
  } catch (error) {
    console.error('[API /admin/organizations/list] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve organizations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
