import { NextRequest, NextResponse } from 'next/server'
import { listOrgTemplates, getSignedTemplateUrl, isS3Configured } from '@/lib/s3-service'
import connectDB from '@/lib/mongodb'
import Event from '@/models/Event'

export const dynamic = 'force-dynamic'

/**
 * GET /api/templates/list?organizationId=xxx
 * List all templates for an organization with signed URLs and event info
 */
export async function GET(request: NextRequest) {
  console.log('\n[API /templates/list] ===== NEW REQUEST =====')
  
  try {
    // Check S3 configuration
    console.log('[API /templates/list] Checking S3 configuration...')
    if (!isS3Configured()) {
      console.error('[API /templates/list] ❌ S3 not configured!')
      return NextResponse.json(
        { success: false, error: 'S3 service not configured' },
        { status: 500 }
      )
    }

    // Get organizationId from query params
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')
    
    console.log('[API /templates/list] Query params:', { organizationId })

    if (!organizationId) {
      console.error('[API /templates/list] ❌ Missing organizationId')
      return NextResponse.json(
        { success: false, error: 'organizationId query parameter is required' },
        { status: 400 }
      )
    }

    console.log(`[Template List] Fetching templates for organization: ${organizationId}`)

    // List templates from S3
    const s3Templates = await listOrgTemplates(organizationId)

    if (s3Templates.length === 0) {
      console.log('[API /templates/list] No S3 templates found')
      return NextResponse.json({
        success: true,
        templates: [],
        message: 'No templates found for this organization',
      })
    }

    // Connect to MongoDB to get event details for each template
    console.log('[API /templates/list] Connecting to MongoDB...')
    await connectDB()
    console.log('[API /templates/list] Fetching events with templates...')
    const events = await Event.find({
      organizationId,
      templateS3Key: { $exists: true, $ne: null },
    })
      .select('name templateS3Key fieldConfiguration date')
      .lean()

    // Map S3 templates with event details and generate signed URLs
    const templatesWithDetails = await Promise.all(
      s3Templates.map(async (s3Template) => {
        // Find matching event
        const matchingEvent = events.find((event) => event.templateS3Key === s3Template.key)

        // Generate signed URL for preview
        let signedUrl = null
        try {
          signedUrl = await getSignedTemplateUrl(s3Template.key, 3600) // 1 hour expiry
        } catch (error) {
          console.error(`[Template List] Error generating signed URL for ${s3Template.key}:`, error)
        }

        return {
          s3Key: s3Template.key,
          fileName: s3Template.fileName,
          size: s3Template.size,
          lastModified: s3Template.lastModified,
          signedUrl,
          eventName: matchingEvent?.name || 'Unknown Event',
          eventId: matchingEvent?._id || null,
          eventDate: matchingEvent?.date || null,
          fieldConfiguration: matchingEvent?.fieldConfiguration || null,
        }
      })
    )

    console.log(`[API /templates/list] ✅ Found ${templatesWithDetails.length} templates with details`)
    console.log('[API /templates/list] ===== REQUEST COMPLETE =====\n')

    return NextResponse.json({
      success: true,
      templates: templatesWithDetails,
      count: templatesWithDetails.length,
    })
  } catch (error) {
    console.error('[Template List] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list templates',
      },
      { status: 500 }
    )
  }
}
