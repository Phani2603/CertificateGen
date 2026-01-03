import { NextRequest, NextResponse } from 'next/server'
import { uploadTemplate, isS3Configured } from '@/lib/s3-service'
import connectDB from '@/lib/mongodb'
import Event from '@/models/Event'

export const dynamic = 'force-dynamic'

// Configure route segment config for larger body size
export const maxDuration = 60 // Maximum duration in seconds

/**
 * POST /api/templates/upload
 * Upload certificate template to S3 and save S3 key to Event
 */
export async function POST(request: NextRequest) {
  console.log('\n[API /templates/upload] ===== NEW REQUEST =====')
  
  try {
    // Check S3 configuration
    console.log('[API /templates/upload] Checking S3 configuration...')
    if (!isS3Configured()) {
      console.error('[API /templates/upload] ❌ S3 not configured!')
      return NextResponse.json(
        { success: false, error: 'S3 service not configured. Check environment variables.' },
        { status: 500 }
      )
    }

    // Parse multipart form data
    console.log('[API /templates/upload] Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const eventId = formData.get('eventId') as string | null
    const organizationId = formData.get('organizationId') as string | null
    const fieldConfiguration = formData.get('fieldConfiguration') as string | null
    
    console.log('[API /templates/upload] Received:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      eventId,
      organizationId,
      hasFieldConfig: !!fieldConfiguration,
    })

    // Validate inputs
    console.log('[API /templates/upload] Validating inputs...')
    if (!file) {
      console.error('[API /templates/upload] ❌ No file provided')
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!eventId || !organizationId) {
      console.error('[API /templates/upload] ❌ Missing eventId or organizationId')
      return NextResponse.json(
        { success: false, error: 'eventId and organizationId are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('[API /templates/upload] ❌ Invalid file type:', file.type)
      return NextResponse.json(
        { success: false, error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to S3
    console.log(`[Template Upload] Uploading template for event: ${eventId}`)
    const s3Key = await uploadTemplate(buffer, organizationId, eventId, file.name)
    console.log(`[Template Upload] Successfully uploaded to S3: ${s3Key}`)

    // Connect to MongoDB and update Event
    console.log('[API /templates/upload] Connecting to MongoDB...')
    await connectDB()
    console.log('[API /templates/upload] Finding event:', eventId)
    const event = await Event.findById(eventId)

    if (!event) {
      console.error('[API /templates/upload] ❌ Event not found:', eventId)
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Parse field configuration if provided
    let parsedFieldConfig = null
    if (fieldConfiguration) {
      try {
        parsedFieldConfig = JSON.parse(fieldConfiguration)
      } catch (error) {
        console.error('[Template Upload] Error parsing field configuration:', error)
      }
    }

    // Update event with template S3 key and field configuration
    console.log('[API /templates/upload] Updating event with S3 key...')
    event.templateS3Key = s3Key
    if (parsedFieldConfig) {
      event.fieldConfiguration = parsedFieldConfig
      console.log('[API /templates/upload] Field configuration added:', parsedFieldConfig.length, 'fields')
    }
    await event.save()

    console.log(`[API /templates/upload] ✅ Event ${eventId} updated successfully`)
    console.log('[API /templates/upload] ===== REQUEST COMPLETE =====\n')

    return NextResponse.json({
      success: true,
      s3Key,
      message: 'Template uploaded successfully',
    })
  } catch (error) {
    console.error('[Template Upload] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload template',
      },
      { status: 500 }
    )
  }
}
