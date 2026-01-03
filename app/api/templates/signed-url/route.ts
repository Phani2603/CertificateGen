import { NextRequest, NextResponse } from 'next/server'
import { getSignedTemplateUrl } from '@/lib/s3-service'

export async function GET(request: NextRequest) {
  console.log('\n[API /templates/signed-url] ===== NEW REQUEST =====')
  
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      console.error('[API /templates/signed-url] ❌ Missing S3 key parameter')
      return NextResponse.json(
        { success: false, error: 'S3 key is required' },
        { status: 400 }
      )
    }

    console.log('[API /templates/signed-url] Generating signed URL for:', key)

    const signedUrl = await getSignedTemplateUrl(key)

    console.log('[API /templates/signed-url] ✅ Signed URL generated')
    console.log('[API /templates/signed-url] ===== REQUEST COMPLETE =====\n')

    return NextResponse.json({
      success: true,
      signedUrl,
    })
  } catch (error) {
    console.error('[API /templates/signed-url] ❌ Error:', error)
    console.log('[API /templates/signed-url] ===== REQUEST FAILED =====\n')
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate signed URL',
      },
      { status: 500 }
    )
  }
}
