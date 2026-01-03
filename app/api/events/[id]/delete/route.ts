import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Event from '@/models/Event'
import Certificate from '@/models/Certificate'
import CertificateHistory from '@/models/CertificateHistory'

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

    const event = await Event.findById(id)

    if (!event) {
      console.error('[API /events/:id DELETE] ❌ Event not found')
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    console.log('[API /events/:id DELETE] Found event:', event.name)
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
