import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import AppSetting from '@/models/AppSetting'
import PrivateOrg from '@/models/PrivateOrg'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const orgSlug = searchParams.get('orgSlug')?.trim().toLowerCase()

    const setting = await AppSetting.findOne({ key: 'global' }).lean()
    const globalWatermarkEnabled = setting?.watermarkEnabled ?? true

    let watermarkEnabled = globalWatermarkEnabled

    if (globalWatermarkEnabled && orgSlug) {
      const org = await PrivateOrg.findOne({ slug: orgSlug })
        .select('watermarkDisabledByAdmin')
        .lean()

      if (org?.watermarkDisabledByAdmin) {
        watermarkEnabled = false
      }
    }

    return NextResponse.json({
      success: true,
      settings: {
        watermarkEnabled,
        scope: orgSlug ? 'organization' : 'global',
      },
    })
  } catch (error) {
    console.error('[Public Watermark Config] GET error:', error)

    // Fail-open to "enabled" so watermark stays on by default.
    return NextResponse.json({
      success: true,
      settings: {
        watermarkEnabled: true,
      },
    })
  }
}
