import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Event from '@/models/Event'
import Certificate from '@/models/Certificate'
import CertificateHistory from '@/models/CertificateHistory'
import PrivateOrg from '@/models/PrivateOrg'
import { refundOrgQuota } from '@/lib/quota-service'
import { auth } from '@/auth'

/**
 * DELETE /api/events/:id
 * Delete an event and all related data (certificates, history)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log('\n[API /events/:id DELETE] ===== NEW REQUEST =====')
  console.log('[API /events/:id DELETE] Event ID:', id)
  
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

    const event = await Event.findById(id)

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    console.log('[API /events/:id DELETE] Found event:', event.name)

    // Count certificates before deletion for quota refund
    const certificateCount = await Certificate.countDocuments({ eventId: id })
    console.log('[API /events/:id DELETE] Certificates to delete:', certificateCount)

    // Refund quota if certificates exist
    if (certificateCount > 0) {
      try {
        // Find organization from event's organizationId
        const org = await PrivateOrg.findById(event.organizationId)
        
        if (org && org.certificateQuota !== undefined) {
          await refundOrgQuota(
            org._id,
            certificateCount,
            `Event deleted: "${event.name}" with ${certificateCount} certificate(s)`,
            session.user?.email || 'system'
          )
          console.log(`[API /events/:id DELETE] Refunded ${certificateCount} quota to ${org.name}`)
        }
      } catch (error) {
        console.error('[API /events/:id DELETE] Error refunding quota:', error)
        // Don't fail the deletion if refund fails
      }
    }

    console.log('[API /events/:id DELETE] Deleting related data...')

    // Delete all certificates related to this event
    const certificatesDeleted = await Certificate.deleteMany({ eventId: id })
    console.log('[API /events/:id DELETE] Deleted certificates:', certificatesDeleted.deletedCount)

    // Delete history entries related to this event
    const historyDeleted = await CertificateHistory.deleteMany({ eventId: id })
    console.log('[API /events/:id DELETE] Deleted history entries:', historyDeleted.deletedCount)

    // Delete the event itself
    await Event.findByIdAndDelete(id)
    console.log('[API /events/:id DELETE] ✅ Event deleted successfully')
    console.log('[API /events/:id DELETE] ===== REQUEST COMPLETE =====\n')

    return NextResponse.json({
      success: true,
      message: 'Event and related data deleted successfully',
      deletedCertificates: certificatesDeleted.deletedCount,
      deletedHistoryEntries: historyDeleted.deletedCount,
    })
  } catch (error) {
    console.error('[API /events/:id DELETE] ❌ Error:', error)
    console.log('[API /events/:id DELETE] ===== REQUEST FAILED =====\n')
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete event',
      },
      { status: 500 }
    )
  }
}
