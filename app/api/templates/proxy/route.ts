import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/templates/proxy
 * Proxy S3 images to bypass CORS issues
 * Fetches image from S3 signed URL and serves it with proper CORS headers
 */
export async function GET(request: NextRequest) {
  console.log('\n[API /templates/proxy] ===== NEW REQUEST =====')
  
  try {
    const { searchParams } = new URL(request.url)
    const signedUrl = searchParams.get('url')

    if (!signedUrl) {
      console.error('[API /templates/proxy] ❌ Missing URL parameter')
      return NextResponse.json(
        { success: false, error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    console.log('[API /templates/proxy] Fetching image from S3...')

    // Fetch image from S3
    const response = await fetch(signedUrl)
    
    if (!response.ok) {
      console.error('[API /templates/proxy] ❌ Failed to fetch from S3:', response.status)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch image from S3' },
        { status: response.status }
      )
    }

    // Get image buffer
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/png'

    console.log('[API /templates/proxy] ✅ Image fetched successfully:', {
      size: imageBuffer.byteLength,
      contentType
    })
    console.log('[API /templates/proxy] ===== REQUEST COMPLETE =====\n')

    // Return image with CORS headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': '*',
      },
    })
  } catch (error) {
    console.error('[API /templates/proxy] ❌ Error:', error)
    console.log('[API /templates/proxy] ===== REQUEST FAILED =====\n')
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to proxy image',
      },
      { status: 500 }
    )
  }
}
