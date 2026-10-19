import { NextRequest } from 'next/server'
import { createBannerImageResponse } from '@/lib/email-banner-generator'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name') || ''
    const fontSize = searchParams.get('fontSize') || undefined
    const top = searchParams.get('top') || undefined
    const left = searchParams.get('left') || undefined
    return createBannerImageResponse(name, { fontSize, top, left })
  } catch (error) {
    console.error('[Email Banner API] Error:', error)
    return new Response('Failed to generate banner', { status: 500 })
  }
}
