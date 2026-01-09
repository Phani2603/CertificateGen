import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import AccessRequest from '@/models/AccessRequest'
import User from '@/models/User'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { requestedType, reason } = body

    if (!requestedType || !['corporate', 'academic'].includes(requestedType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid requested type' },
        { status: 400 }
      )
    }

    // Check if there's already a pending request
    const existingRequest = await AccessRequest.findOne({
      userId: user._id,
      status: 'pending'
    })

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: 'You already have a pending request' },
        { status: 400 }
      )
    }

    // Create request
    const accessRequest = await AccessRequest.create({
      userId: user._id,
      currentType: user.userType,
      requestedType,
      reason,
      status: 'pending',
      requestedAt: new Date()
    })

    // Notify admin via WebSocket
    const io = (global as any).io
    if (io) {
      io.to('admin').emit('new-access-request', {
        requestId: accessRequest._id,
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        currentType: user.userType,
        requestedType,
        reason,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      request: accessRequest
    })
  } catch (error) {
    console.error('[Access Request] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

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

    const user = await User.findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const requests = await AccessRequest.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      requests
    })
  } catch (error) {
    console.error('[Access Request GET] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch requests',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
