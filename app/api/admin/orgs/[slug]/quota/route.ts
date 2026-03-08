import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectDB from '@/lib/mongodb'
import { allocateOrgQuota, getOrgQuotaHistory, QuotaValidationError } from '@/lib/quota-service'
import PrivateOrg from '@/models/PrivateOrg'

// Helper to check admin auth
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  return !!adminSession?.value
}

export async function PATCH(
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
    const { quota, reason } = await request.json()

    // Validate quota
    if (typeof quota !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Quota must be a number' },
        { status: 400 }
      )
    }

    // Validate reason
    if (!reason || typeof reason !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Reason is required' },
        { status: 400 }
      )
    }

    // Find organization by slug
    const org = await PrivateOrg.findOne({ slug })
    
    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Allocate quota
    const updatedOrg = await allocateOrgQuota(org._id, quota, 'admin', reason)

    return NextResponse.json({
      success: true,
      message: `Quota updated successfully for ${org.name}`,
      data: {
        orgName: updatedOrg.name,
        orgSlug: updatedOrg.slug,
        previousQuota: org.certificateQuota ?? -1,
        newQuota: updatedOrg.certificateQuota,
        used: updatedOrg.certificatesUsed,
        available: updatedOrg.certificateQuota === -1 
          ? -1 
          : Math.max(0, updatedOrg.certificateQuota - updatedOrg.certificatesUsed),
      },
    })
  } catch (error) {
    console.error('[API /admin/orgs/:slug/quota] Error:', error)
    
    if (error instanceof QuotaValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update quota',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(
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
    
    const { slug} = await params

    // Find organization by slug
    const org = await PrivateOrg.findOne({ slug })
    
    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Get quota history
    const history = await getOrgQuotaHistory(org._id, 100)

    return NextResponse.json({
      success: true,
      data: {
        orgName: org.name,
        orgSlug: org.slug,
        quota: org.certificateQuota ?? -1,
        used: org.certificatesUsed ?? 0,
        available: (org.certificateQuota ?? -1) === -1 
          ? -1 
          : Math.max(0, (org.certificateQuota ?? -1) - (org.certificatesUsed ?? 0)),
        quotaMetadata: org.quotaMetadata,
        history,
      },
    })
  } catch (error) {
    console.error('[API /admin/orgs/:slug/quota] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve quota information',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
