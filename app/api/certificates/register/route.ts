import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Certificate from '@/models/Certificate'
import Event from '@/models/Event'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  console.log('\n[API /certificates/register] ===== NEW REQUEST =====')
  
  try {
    await connectDB()

    const body = await request.json()
    const { certificates, batchId, generatedBy, eventId, fieldConfiguration, templateS3Key } = body
    
    console.log('[API /certificates/register] Request data:', {
      certificateCount: certificates?.length,
      batchId,
      generatedBy,
      eventId,
      hasFieldConfig: !!fieldConfiguration,
      hasTemplateS3Key: !!templateS3Key,
      templateS3KeyValue: templateS3Key, // NEW: Log actual value
    })

    if (!certificates || !Array.isArray(certificates) || certificates.length === 0) {
      console.error('[API /certificates/register] ❌ No certificates provided')
      return NextResponse.json(
        { success: false, error: 'No certificates provided' },
        { status: 400 }
      )
    }

    console.log(`[API /certificates/register] Registering ${certificates.length} certificates`)
    
    // If eventId provided, update Event model with field configuration and template S3 key
    if (eventId) {
      console.log('[API /certificates/register] Updating Event with template and field config...')
      try {
        const event = await Event.findById(eventId)
        if (event) {
          let updated = false
          
          // Save field configuration if provided
          if (fieldConfiguration) {
            event.fieldConfiguration = fieldConfiguration
            updated = true
            console.log('[API /certificates/register] ✅ Field configuration will be saved')
          }
          
          // Save template S3 key if provided (for reused templates)
          if (templateS3Key && !event.templateS3Key) {
            event.templateS3Key = templateS3Key
            updated = true
            console.log('[API /certificates/register] ✅ Template S3 key will be saved:', templateS3Key)
          }
          
          if (updated) {
            await event.save()
            console.log('[API /certificates/register] ✅ Event updated successfully')
          }
        } else {
          console.warn('[API /certificates/register] ⚠️ Event not found:', eventId)
        }
      } catch (err) {
        console.error('[API /certificates/register] Error updating event:', err)
      }
    }

    // Process certificates in batch
    const registeredCertificates = []
    const errors = []

    for (const cert of certificates) {
      try {
        // Generate unique verification ID
        const verificationId = randomUUID()

        // Create issueDate ONCE and use it for both hash and storage
        const issueDate = new Date()

        // Generate hash for integrity using the SAME issueDate
        const certificateHash = Certificate.generateHash({
          recipientName: cert.recipientName,
          recipientEmail: cert.recipientEmail,
          eventName: cert.eventName,
          eventDate: cert.eventDate,
          organizationName: cert.organizationName,
          clubName: cert.clubName,
          issueDate: issueDate,  // Use the same Date object
        })

        // Create certificate record with the SAME issueDate
        const newCertificate = await Certificate.create({
          verificationId,
          certificateHash,
          recipientName: cert.recipientName,
          recipientEmail: cert.recipientEmail,
          eventId: eventId || null, // NEW: Store eventId reference
          eventName: cert.eventName,
          eventDate: cert.eventDate, // Keep as string for hash consistency
          organizationName: cert.organizationName,
          clubName: cert.clubName,
          issueDate: issueDate,  // Same Date object used in hash
          isValid: true,
          metadata: {
            batchId,
            generatedBy,
          },
        })

        registeredCertificates.push({
          recipientEmail: cert.recipientEmail,
          recipientName: cert.recipientName,
          verificationId: newCertificate.verificationId,
          verificationUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify/${newCertificate.verificationId}`,
        })

        console.log(`[API /certificates/register] ✅ Registered: ${cert.recipientName} - ${verificationId}`)
      } catch (error) {
        console.error(`[Certificate Registration] Error for ${cert.recipientEmail}:`, error)
        errors.push({
          recipientEmail: cert.recipientEmail,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log(`[API /certificates/register] ✅ Successfully registered ${registeredCertificates.length}/${certificates.length} certificates`)
    console.log('[API /certificates/register] ===== REQUEST COMPLETE =====\n')

    return NextResponse.json({
      success: true,
      registered: registeredCertificates.length,
      total: certificates.length,
      certificates: registeredCertificates,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[Certificate Registration] Server error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register certificates',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
