import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectDB from '@/lib/mongodb'
import AppSetting from '@/models/AppSetting'

async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  return !!adminSession && adminSession.value === 'true'
}

export async function GET() {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const setting = await AppSetting.findOne({ key: 'global' }).lean()
    const watermarkEnabled = setting?.watermarkEnabled ?? true

    return NextResponse.json({
      success: true,
      settings: {
        watermarkEnabled,
      },
    })
  } catch (error) {
    console.error('[Admin Watermark Config] GET error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch watermark settings',
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const watermarkEnabled = body?.watermarkEnabled

    if (typeof watermarkEnabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'watermarkEnabled must be a boolean' },
        { status: 400 }
      )
    }

    await connectDB()

    const updated = await AppSetting.findOneAndUpdate(
      { key: 'global' },
      { $set: { watermarkEnabled } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean()

    return NextResponse.json({
      success: true,
      settings: {
        watermarkEnabled: updated?.watermarkEnabled ?? true,
      },
    })
  } catch (error) {
    console.error('[Admin Watermark Config] PUT error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update watermark settings',
      },
      { status: 500 }
    )
  }
}
