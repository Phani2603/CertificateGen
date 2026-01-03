import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Event from '@/models/Event'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log('\n[API /events/:id] ===== NEW REQUEST =====')
  console.log('[API /events/:id] Event ID:', id)
  
  try {
    await connectDB()

    const event = await Event.findById(id)

    if (!event) {
      console.error('[API /events/:id] ❌ Event not found')
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    console.log('[API /events/:id] ✅ Event found:', {
      eventName: event.name,
      hasTemplate: !!event.templateS3Key,
      hasFieldConfig: !!event.fieldConfiguration,
    })
    console.log('[API /events/:id] ===== REQUEST COMPLETE =====\n')

    return NextResponse.json({
      success: true,
      event: {
        _id: event._id,
        name: event.name,
        description: event.description,
        date: event.date,
        clubId: event.clubId,
        organizationId: event.organizationId,
        templateS3Key: event.templateS3Key,
        fieldConfiguration: event.fieldConfiguration,
      },
    })
  } catch (error) {
    console.error('[API /events/:id] ❌ Error:', error)
    console.log('[API /events/:id] ===== REQUEST FAILED =====\n')
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch event',
      },
      { status: 500 }
    )
  }
}
