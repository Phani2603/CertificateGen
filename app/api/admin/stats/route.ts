import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Organization from '@/models/Organization'
import PrivateOrg from '@/models/PrivateOrg'
import AccessRequest from '@/models/AccessRequest'
import Event from '@/models/Event'
import CertificateHistory from '@/models/CertificateHistory'

// Middleware to check admin authentication
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  
  if (!adminSession || adminSession.value !== 'true') {
    return false
  }
  
  return true
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth()
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Fetch all stats in parallel
    const [
      totalUsers,
      individualUsers,
      corporateUsers,
      academicUsers,
      pendingRequests,
      totalOrganizations,
      totalPrivateOrgs,
      totalEvents,
      historyRecords,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ userType: 'individual' }),
      User.countDocuments({ userType: 'corporate' }),
      User.countDocuments({ userType: 'academic' }),
      AccessRequest.countDocuments({ status: 'pending' }),
      Organization.countDocuments(),
      PrivateOrg.countDocuments(),
      Event.countDocuments(),
      CertificateHistory.find(),
    ])

    // Calculate total certificates from history
    const totalCertificates = historyRecords.reduce((sum, record: any) => {
      return sum + (record.certificateCount || 0)
    }, 0)

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        individualUsers,
        corporateUsers,
        academicUsers,
        pendingRequests,
        totalOrganizations,
        totalPrivateOrgs,
        totalEvents,
        totalCertificates,
        recentActivity: historyRecords.length,
      },
    })
  } catch (error) {
    console.error('[Admin Stats] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
