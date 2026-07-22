import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import AdminLog from '@/models/AdminLog'
import { setAdminSessionCookie } from '@/lib/admin-auth'

// Test GET endpoint to verify logging works
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    console.log('[Admin Login Test] Connected to DB')
    
    const testLog = await AdminLog.create({
      adminId: null,
      adminEmail: 'test@example.com',
      action: 'TEST_LOG',
      targetType: 'admin',
      targetId: new mongoose.Types.ObjectId(),
      details: { test: true },
      ipAddress: 'test-ip',
      userAgent: 'test-agent',
    })
    
    console.log('[Admin Login Test] Created test log:', testLog._id)
    
    const allLogs = await AdminLog.find().limit(5)
    console.log('[Admin Login Test] All logs:', allLogs.length)
    
    return NextResponse.json({
      success: true,
      message: 'Test log created',
      testLogId: testLog._id,
      totalLogs: allLogs.length
    })
  } catch (error) {
    console.error('[Admin Login Test] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, geoLocation } = body

    // Check against admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Admin credentials not configured' },
        { status: 500 }
      )
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin credentials' },
        { status: 401 }
      )
    }

    // Set admin session cookie
    const cookieStore = await cookies()
    await setAdminSessionCookie(cookieStore)

    // Record admin login event with context
    try {
      console.log('[Admin Login] Starting to log admin session...')
      await connectDB()
      console.log('[Admin Login] Database connected')
      
      // Get IP address with multiple fallbacks
      let ipAddress = 'unknown'
      const ipHeader =
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-client-ip')
      
      if (ipHeader) {
        ipAddress = ipHeader.split(',')[0]?.trim()
      }
      
      // If localhost, try to get public IP
      if (ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress === 'unknown') {
        try {
          const publicIpRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) })
          if (publicIpRes.ok) {
            const { ip } = await publicIpRes.json()
            ipAddress = ip || ipAddress
          }
        } catch (ipErr) {
          console.warn('[Admin Login] Could not fetch public IP:', ipErr)
        }
      }
      
      const userAgent = request.headers.get('user-agent') || 'unknown'
      
      // Merge Vercel headers with client geolocation (client takes priority if available)
      const geo = {
        city: request.headers.get('x-vercel-ip-city') || null,
        region: request.headers.get('x-vercel-ip-country-region') || null,
        country: request.headers.get('x-vercel-ip-country') || null,
        latitude: geoLocation?.latitude?.toString() || request.headers.get('x-vercel-ip-latitude') || null,
        longitude: geoLocation?.longitude?.toString() || request.headers.get('x-vercel-ip-longitude') || null,
      }

      const logData = {
        adminId: null,
        adminEmail: adminEmail,
        action: 'ADMIN_LOGIN',
        targetType: 'admin',
        targetId: new mongoose.Types.ObjectId(),
        details: { geo },
        ipAddress,
        userAgent,
      }
      
      console.log('[Admin Login] Creating log entry:', JSON.stringify(logData, null, 2))
      const createdLog = await AdminLog.create(logData)
      console.log('[Admin Login] Log entry created successfully:', createdLog._id)
    } catch (logErr) {
      console.error('[Admin Login] Failed to log admin session:', logErr)
      console.error('[Admin Login] Error details:', logErr instanceof Error ? logErr.message : logErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Admin authenticated successfully',
    })
  } catch (error) {
    console.error('[Admin Login] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to authenticate',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
