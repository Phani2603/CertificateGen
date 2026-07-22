import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectDB from '@/lib/mongodb'
import Event from '@/models/Event'
import Certificate from '@/models/Certificate'
import { uploadTemplate, isS3Configured } from '@/lib/s3-service'
import { verifyAdminSessionValue } from '@/lib/admin-auth'

async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  return verifyAdminSessionValue(adminSession?.value)
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!isS3Configured()) {
      return NextResponse.json(
        { success: false, error: 'S3 service not configured' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const oldS3Key = formData.get('oldS3Key') as string | null
    const eventId = formData.get('eventId') as string | null

    if (!file || !oldS3Key || !eventId) {
      return NextResponse.json(
        { success: false, error: 'file, oldS3Key, and eventId are required' },
        { status: 400 }
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find the event
    const event = await Event.findById(eventId)
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Determine organizationId from the event
    const organizationId = String(event.privateOrgId || event.organizationId || 'unknown')

    // Upload the new template to S3
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const newS3Key = await uploadTemplate(buffer, organizationId, eventId, file.name)

    console.log(`[Admin S3 Reupload] New key: ${newS3Key}, replacing old key: ${oldS3Key}`)

    // Update all events that reference the old S3 key
    const eventUpdateResult = await Event.updateMany(
      { templateS3Key: oldS3Key },
      { $set: { templateS3Key: newS3Key } }
    )

    // Update all certificates that reference the old S3 key
    const certUpdateResult = await Certificate.updateMany(
      { templateS3Key: oldS3Key },
      { $set: { templateS3Key: newS3Key } }
    )

    console.log(`[Admin S3 Reupload] Updated ${eventUpdateResult.modifiedCount} events, ${certUpdateResult.modifiedCount} certificates`)

    return NextResponse.json({
      success: true,
      newS3Key,
      updatedEvents: eventUpdateResult.modifiedCount,
      updatedCertificates: certUpdateResult.modifiedCount,
      message: `Template re-uploaded. Updated ${eventUpdateResult.modifiedCount} event(s) and ${certUpdateResult.modifiedCount} certificate(s).`,
    })
  } catch (error) {
    console.error('[Admin S3 Reupload] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to re-upload template' },
      { status: 500 }
    )
  }
}
