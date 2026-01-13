import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Certificate from '@/models/Certificate'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Verification ID is required' },
        { status: 400 }
      )
    }

    console.log(`[Certificate Verification] Looking up: ${id}`)

    // Find certificate by verification ID
    const certificate = await Certificate.findOne({ verificationId: id })

    if (!certificate) {
      console.log(`[Certificate Verification] Not found: ${id}`)
      return NextResponse.json(
        { success: false, error: 'Certificate not found' },
        { status: 404 }
      )
    }

    console.log(`[Certificate Verification] Found certificate:`, {
      recipientName: certificate.recipientName,
      recipientEmail: certificate.recipientEmail,
      issueDate: certificate.issueDate,
      issueDateType: typeof certificate.issueDate,
      issueDateISO: certificate.issueDate instanceof Date ? certificate.issueDate.toISOString() : 'Not a Date object',
      storedHash: certificate.certificateHash
    })

    // Verify hash integrity
    const isHashValid = Certificate.verifyHash(certificate)

    if (!isHashValid) {
      console.warn(`[Certificate Verification] Hash mismatch for: ${id}`)
      return NextResponse.json(
        {
          success: false,
          error: 'Certificate data has been tampered with',
          certificate: null,
        },
        { status: 400 }
      )
    }

    // Check if certificate is valid (not revoked)
    if (!certificate.isValid) {
      console.log(`[Certificate Verification] Revoked: ${id}`)
      return NextResponse.json(
        {
          success: true,
          valid: false,
          revoked: true,
          certificate: {
            recipientName: certificate.recipientName,
            eventName: certificate.eventName,
            organizationName: certificate.organizationName,
            clubName: certificate.clubName,
          },
        },
        { status: 200 }
      )
    }

    console.log(`[Certificate Verification] Valid certificate found: ${id}`)

    // Return certificate data including template and field configuration
    return NextResponse.json({
      success: true,
      valid: true,
      certificate: {
        id: certificate.verificationId,
        recipientName: certificate.recipientName,
        recipientEmail: certificate.recipientEmail,
        eventName: certificate.eventName,
        eventDate: certificate.eventDate,
        organizationName: certificate.organizationName,
        clubName: certificate.clubName,
        issueDate: certificate.issueDate,
        verificationCode: `CERT-${certificate.verificationId.substring(0, 8).toUpperCase()}`,
        eventId: certificate.eventId, // Return eventId for fetching template as fallback
        templateS3Key: certificate.templateS3Key, // Template stored on certificate
        fieldConfiguration: certificate.fieldConfiguration, // Field config stored on certificate
      },
    })
  } catch (error) {
    console.error('[Certificate Verification] Server error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify certificate',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
