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
      recipientEmail: session.user.email
    })
      .sort({ issuedDate: -1 })
      .select('recipientName recipientEmail eventName issuedDate certificateUrl organizationId privateOrgId')
      .lean()

    // Populate organization names if needed
    const enrichedCertificates = await Promise.all(
      certificates.map(async (cert: any) => {
        if (cert.organizationId) {
          const Organization = (await import('@/models/Organization')).default
          const org = await Organization.findById(cert.organizationId).select('name')
          return { ...cert, organizationName: org?.name }
        } else if (cert.privateOrgId) {
          const PrivateOrg = (await import('@/models/PrivateOrg')).default
          const org = await PrivateOrg.findById(cert.privateOrgId).select('name')
          return { ...cert, privateOrgName: org?.name }
        }
        return cert
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
