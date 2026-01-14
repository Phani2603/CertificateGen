import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Certificate from '@/models/Certificate'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Find all certificates for the logged-in user's email
    const certificates = await Certificate.find({
      recipientEmail: session.user.email,
    })
      // Sort by stored issueDate (Date field in schema)
      .sort({ issueDate: -1 })
      // Select all fields needed by the dashboard, including schema's issueDate
      .select(
        'verificationId recipientName recipientEmail eventName issueDate templateS3Key fieldConfiguration eventId organizationName clubName organizationId privateOrgId'
      )
      .lean()

    console.log(`[My Certificates] Found ${certificates.length} certificates for ${session.user.email}`)
    console.log(`[My Certificates] First cert has templateS3Key: ${certificates[0]?.templateS3Key ? 'YES' : 'NO'}`)

    // Populate organization names from related collections when legacy IDs exist
    const enrichedCertificates = await Promise.all(
      certificates.map(async (cert: any) => {
        let organizationName = cert.organizationName
        let privateOrgName = cert.privateOrgName

        if (cert.organizationId && !organizationName) {
          const Organization = (await import('@/models/Organization')).default
          const org = await Organization.findById(cert.organizationId).select('name')
          organizationName = org?.name || organizationName
        } else if (cert.privateOrgId && !privateOrgName) {
          const PrivateOrg = (await import('@/models/PrivateOrg')).default
          const org = await PrivateOrg.findById(cert.privateOrgId).select('name')
          privateOrgName = org?.name || privateOrgName
        }

        // Alias issueDate -> issuedDate for the frontend while keeping both for safety
        const issuedDate = cert.issuedDate || cert.issueDate

        return {
          ...cert,
          organizationName,
          privateOrgName,
          issuedDate,
        }
      })
    )

    return NextResponse.json({
      success: true,
      certificates: enrichedCertificates,
    })
  } catch (error) {
    console.error('[My Certificates] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch certificates',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
