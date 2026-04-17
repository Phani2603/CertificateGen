import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Certificate from '@/models/Certificate'
import Event from '@/models/Event'
import { randomUUID } from 'crypto'
import { checkOrgQuota, consumeOrgQuota, QuotaExceededError } from '@/lib/quota-service'

export async function POST(request: NextRequest) {
  console.log('\n[API /certificates/register] ===== NEW REQUEST =====')
  
  try {
    await connectDB()

    const body = await request.json()
    const { certificates, batchId, generatedBy, eventId, fieldConfiguration, templateS3Key, orgId, orgName } = body
    
    console.log('[API /certificates/register] Request data:', {
      certificateCount: certificates?.length,
      batchId,
      generatedBy,
      eventId,
      hasFieldConfig: !!fieldConfiguration,
      hasTemplateS3Key: !!templateS3Key,
      templateS3KeyValue: templateS3Key, // NEW: Log actual value
      hasCertificateImages: certificates?.[0]?.certificateImage ? 'yes' : 'no', // NEW: Check for images
      orgId, // Organization ID for quota checking
      orgName, // Organization name
    })

    if (!certificates || !Array.isArray(certificates) || certificates.length === 0) {
      console.error('[API /certificates/register] ❌ No certificates provided')
      return NextResponse.json(
        { success: false, error: 'No certificates provided' },
        { status: 400 }
      )
    }

    // Check organization quota before processing (if orgId provided)
    if (orgId) {
      try {
        console.log(`[API /certificates/register] Checking quota for org ${orgName} (${orgId})...`)
        const quotaCheck = await checkOrgQuota(orgId, certificates.length)
        
        if (!quotaCheck.hasQuota) {
          console.error('[API /certificates/register] ❌ Quota exceeded')
          return NextResponse.json(
            {
              success: false,
              error: 'quota_exceeded',
              message: `Insufficient quota. You have ${quotaCheck.available} certificates remaining but trying to generate ${certificates.length}.`,
              quota: quotaCheck.quota,
              used: quotaCheck.used,
              available: quotaCheck.available,
            },
            { status: 403 }
          )
        }
        
        console.log(`[API /certificates/register] ✅ Quota check passed: ${quotaCheck.available} available (unlimited: ${quotaCheck.quota === -1})`)
      } catch (error) {
        console.error('[API /certificates/register] Error checking quota:', error)
        // Continue without quota check if there's an error (fail open)
        console.warn('[API /certificates/register] ⚠️ Proceeding without quota check due to error')
      }
    } else {
      console.log('[API /certificates/register] No orgId provided - skipping quota check')
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

        // Log certificate data
        const hasImage = !!cert.certificateImage
        const imageSize = cert.certificateImage ? Math.round(cert.certificateImage.length / 1024) : 0
        console.log(`[API /certificates/register] Processing cert for ${cert.recipientEmail}:`, {
          hasTemplate: !!cert.templateS3Key,
          templateS3Key: cert.templateS3Key,
          hasFieldConfig: !!cert.fieldConfiguration,
          fieldConfigCount: cert.fieldConfiguration?.length || 0,
        })

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
          recipientNameLower: String(cert.recipientName || '').toLowerCase().trim(),
          recipientEmailLower: String(cert.recipientEmail || '').toLowerCase().trim(),
          eventId: eventId || null, // NEW: Store eventId reference
          eventName: cert.eventName,
          eventDate: cert.eventDate, // Keep as string for hash consistency
          organizationName: cert.organizationName,
          clubName: cert.clubName,
          issueDate: issueDate,  // Same Date object used in hash
          isValid: true,
          templateS3Key: cert.templateS3Key || null, // NEW: Store S3 key for template
          fieldConfiguration: cert.fieldConfiguration || null, // NEW: Store field configuration
          resolvedFieldValues: cert.resolvedFieldValues || null,
          watermarkEnabledAtIssue: cert.watermarkEnabledAtIssue !== false,
          metadata: {
            batchId,
            generatedBy,
          },
        })

        registeredCertificates.push({
          certificateId: newCertificate._id.toString(),
          recipientEmail: cert.recipientEmail,
          recipientName: cert.recipientName,
          verificationId: newCertificate.verificationId,
          batchId,
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
    
    // Consume organization quota for successfully registered certificates
    if (orgId && registeredCertificates.length > 0) {
      try {
        console.log(`[API /certificates/register] Consuming ${registeredCertificates.length} quota for org ${orgName}...`)
        await consumeOrgQuota(orgId, registeredCertificates.length, batchId, generatedBy)
        console.log('[API /certificates/register] ✅ Quota consumed successfully')
      } catch (error) {
        console.error('[API /certificates/register] ⚠️ Error consuming quota:', error)
        // Don't fail the request if quota consumption fails - certificates are already registered
        // Admin can manually adjust quota if needed
      }
    }
    
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
