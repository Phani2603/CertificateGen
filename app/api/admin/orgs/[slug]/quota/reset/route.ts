import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectDB from '@/lib/mongodb'
import PrivateOrg from '@/models/PrivateOrg'
import QuotaTransaction from '@/models/QuotaTransaction'
import { verifyAdminSessionValue } from '@/lib/admin-auth'

// Helper to check admin auth
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  return verifyAdminSessionValue(adminSession?.value)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    await connectDB()

    const { slug } = await params

    // Find organization by slug
    const org = await PrivateOrg.findOne({ slug })
    
    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    const previousUsed = org.certificatesUsed ?? 0
    const quota = org.certificateQuota ?? -1

    // Reset usage to 0
    org.certificatesUsed = 0
    await org.save()

    // Create audit log transaction
    await QuotaTransaction.create({
      orgId: org._id,
      orgName: org.name,
      transactionType: 'reset',
      amount: previousUsed, // Amount reset
      previousQuota: quota,
      newQuota: quota,
      previousUsed,
      newUsed: 0,
      performedBy: 'admin',
      reason: 'Manual quota reset by administrator',
      metadata: {
        timestamp: new Date(),
        adminAction: true,
        resetType: 'manual',
      },
    })

    return NextResponse.json({
      success: true,
      message: `Quota usage reset for ${org.name}`,
      data: {
        orgName: org.name,
        orgSlug: org.slug,
        previousUsed,
        newUsed: 0,
        quota,
      },
    })
  } catch (error) {
    console.error('[API /admin/orgs/:slug/quota/reset] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset quota',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
