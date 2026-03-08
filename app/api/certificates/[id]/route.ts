import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Certificate from '@/models/Certificate'
import PrivateOrg from '@/models/PrivateOrg'
import { refundOrgQuota } from '@/lib/quota-service'
import { auth } from '@/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    // Check authentication
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const { id } = params

    // Find the certificate
    const certificate = await Certificate.findById(id)
    
    if (!certificate) {
      return NextResponse.json(
        { success: false, error: 'Certificate not found' },
        { status: 404 }
      )
    }

    // Find the organization from the certificate's metadata or organizationName
    const org = await PrivateOrg.findOne({ name: certificate.organizationName })
    
    // Delete the certificate
    await Certificate.findByIdAndDelete(id)

    // Refund quota if organization exists and has quota tracking
    if (org && org.certificateQuota !== undefined) {
      try {
        await refundOrgQuota(
          org._id,
          1,
          `Certificate deleted: ${certificate.recipientName} (${certificate.recipientEmail})`,
          session.user.email || 'system'
        )
        console.log(`[API /certificates/${id}] Refunded 1 quota to ${org.name}`)
      } catch (error) {
        console.error('[API /certificates/:id] Error refunding quota:', error)
        // Don't fail the deletion if refund fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Certificate deleted successfully',
      refunded: !!org,
    })
  } catch (error) {
    console.error('[API /certificates/:id] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete certificate',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
