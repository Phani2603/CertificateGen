import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Certificate from '@/models/Certificate'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { certificates, batchId, generatedBy } = body

    if (!certificates || !Array.isArray(certificates) || certificates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No certificates provided' },
        { status: 400 }
      )
    }

    console.log(`[Certificate Registration] Registering ${certificates.length} certificates`)

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

        console.log(`[Certificate Registration] Registered: ${cert.recipientName} - ${verificationId}`)
      } catch (error) {
        console.error(`[Certificate Registration] Error for ${cert.recipientEmail}:`, error)
        errors.push({
          recipientEmail: cert.recipientEmail,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log(`[Certificate Registration] Successfully registered ${registeredCertificates.length}/${certificates.length} certificates`)

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
