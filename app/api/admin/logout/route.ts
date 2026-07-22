import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { clearAdminSessionCookie } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    await clearAdminSessionCookie(cookieStore)

    return NextResponse.json({
      success: true,
      message: 'Admin logged out successfully',
    })
  } catch (error) {
    console.error('[Admin Logout] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to logout',
      },
      { status: 500 }
    )
  }
}
