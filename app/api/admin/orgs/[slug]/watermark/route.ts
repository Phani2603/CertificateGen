import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectDB from '@/lib/mongodb'
import PrivateOrg from '@/models/PrivateOrg'

async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  return !!adminSession?.value
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

    const { slug } = await params
    const org = await PrivateOrg.findOne({ slug }).select('name slug watermarkDisabledByAdmin').lean()

    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        name: org.name,
        slug: org.slug,
        watermarkDisabledByAdmin: !!org.watermarkDisabledByAdmin,
      },
    })
  } catch (error) {
    console.error('[API /admin/orgs/:slug/watermark] GET error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch watermark settings',
      },
      { status: 500 }
    )
  }
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
    const body = await request.json()
    const watermarkDisabledByAdmin = body?.watermarkDisabledByAdmin

    if (typeof watermarkDisabledByAdmin !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'watermarkDisabledByAdmin must be a boolean' },
        { status: 400 }
      )
    }

    const updated = await PrivateOrg.findOneAndUpdate(
      { slug },
      { $set: { watermarkDisabledByAdmin } },
      { new: true }
    ).select('name slug watermarkDisabledByAdmin')

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Watermark ${watermarkDisabledByAdmin ? 'disabled' : 'enabled'} for ${updated.name}`,
      data: {
        name: updated.name,
        slug: updated.slug,
        watermarkDisabledByAdmin: !!updated.watermarkDisabledByAdmin,
      },
    })
  } catch (error) {
    console.error('[API /admin/orgs/:slug/watermark] PATCH error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update watermark settings',
      },
      { status: 500 }
    )
  }
}
