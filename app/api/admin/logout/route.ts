import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('admin-session')

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
