import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectDB from '@/lib/mongodb'
import PrivateOrg from '@/models/PrivateOrg'
import { verifyAdminSessionValue } from '@/lib/admin-auth'

// Helper to check admin auth
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  return verifyAdminSessionValue(adminSession?.value)
}

/**
 * GET /api/quota/check-alerts
 * Check all organizations for low quota and return alerts
 * This can be called periodically by the frontend or a cron job
 */
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

    // Find all organizations with quota limits (not unlimited)
    const orgs = await PrivateOrg.find({
      certificateQuota: { $ne: -1, $gte: 0 }
    }).lean()

    const alerts = []

    for (const org of orgs) {
      const quota = org.certificateQuota ?? 0
      const used = org.certificatesUsed ?? 0
      
      if (quota === 0) continue

      const percentage = (used / quota) * 100
      const available = Math.max(0, quota - used)

      // Critical: 95% or higher
      if (percentage >= 95) {
        alerts.push({
          orgId: org._id,
          orgName: org.name,
          orgSlug: org.slug,
          severity: 'critical',
          percentage: percentage.toFixed(1),
          used,
          quota,
          available,
          message: `${org.name} has only ${available} certificates remaining (${percentage.toFixed(0)}% used)`,
        })
      }
      // Warning: 80-94%
      else if (percentage >= 80) {
        alerts.push({
          orgId: org._id,
          orgName: org.name,
          orgSlug: org.slug,
          severity: 'warning',
          percentage: percentage.toFixed(1),
          used,
          quota,
          available,
          message: `${org.name} has ${available} certificates remaining (${percentage.toFixed(0)}% used)`,
        })
      }
    }

    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
    })
  } catch (error) {
    console.error('[API /quota/check-alerts] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check quota alerts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
