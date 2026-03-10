import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import ContactForm from '@/models/ContactForm'
import { cookies } from 'next/headers'

/**
 * PATCH /api/contact/[id]
 * Update contact form status or notes
 * Requires admin authentication
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin-session')

    if (!adminSession || adminSession.value !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const body = await request.json()
    const { status, notes } = body
    const { id } = await params

    // Validate MongoDB ObjectId format
    if (!id || id.length !== 24 || !/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid contact form ID format' },
        { status: 400 }
      )
    }

    // Validate status if provided
    const validStatuses = ['new', 'read', 'replied', 'archived']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: any = {}
    if (status !== undefined) {
      updateData.status = status
      
      // Update timestamp fields based on status
      if (status === 'read' && !updateData.readAt) {
        updateData.readAt = new Date()
      } else if (status === 'replied' && !updateData.repliedAt) {
        updateData.repliedAt = new Date()
      }
    }
    
    if (notes !== undefined) {
      updateData.notes = notes
    }

    // Find and update the contact form
    const contactForm = await ContactForm.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!contactForm) {
      console.log(`[PATCH] Contact form not found with ID: ${id}`)
      return NextResponse.json(
        { success: false, error: 'Contact form not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: contactForm,
    })
  } catch (error: any) {
    console.error('[PATCH] Error updating contact form:', error)
    
    // Handle Mongoose CastError (invalid ObjectId)
    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: 'Invalid contact form ID' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/contact/[id]
 * Get single contact form by ID
 * Requires admin authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin-session')

    if (!adminSession || adminSession.value !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { id } = await params

    // Validate MongoDB ObjectId format
    if (!id || id.length !== 24 || !/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid contact form ID format' },
        { status: 400 }
      )
    }

    const contactForm = await ContactForm.findById(id)

    if (!contactForm) {
      console.log(`[GET] Contact form not found with ID: ${id}`)
      return NextResponse.json(
        { success: false, error: 'Contact form not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: contactForm,
    })
  } catch (error: any) {
    console.error('[GET] Error fetching contact form:', error)
    
    // Handle Mongoose CastError (invalid ObjectId)
    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: 'Invalid contact form ID' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/contact/[id]
 * Delete contact form by ID
 * Requires admin authentication
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin-session')

    if (!adminSession || adminSession.value !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { id } = await params

    // Validate MongoDB ObjectId format
    if (!id || id.length !== 24 || !/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid contact form ID format' },
        { status: 400 }
      )
    }

    const contactForm = await ContactForm.findByIdAndDelete(id)

    if (!contactForm) {
      console.log(`[DELETE] Contact form not found with ID: ${id}`)
      return NextResponse.json(
        { success: false, error: 'Contact form not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Contact form deleted successfully',
    })
  } catch (error: any) {
    console.error('[DELETE] Error deleting contact form:', error)
    
    // Handle Mongoose CastError (invalid ObjectId)
    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: 'Invalid contact form ID' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
