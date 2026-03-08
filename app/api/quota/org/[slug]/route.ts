import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { getOrgQuotaInfo } from '@/lib/quota-service'
import PrivateOrg from '@/models/PrivateOrg'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB()
    
    const { slug } = await params

    // Find organization by slug
    const org = await PrivateOrg.findOne({ slug }).lean()
    
    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Get quota information
    const quotaInfo = await getOrgQuotaInfo(org._id)

    return NextResponse.json({
      success: true,
      data: quotaInfo,
    })
  } catch (error) {
    console.error('[API /quota/org/:slug] Error:', error)
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
