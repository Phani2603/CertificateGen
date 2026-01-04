import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Organization from '@/models/Organization'
import PrivateOrg from '@/models/PrivateOrg'
import AdminLog from '@/models/AdminLog'

// Helper to check admin auth
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  return !!adminSession?.value
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params
    const cleanId = id.trim()
    
    console.log(`[Admin Delete] Attempting to delete org with ID: "${cleanId}"`)

    if (!mongoose.Types.ObjectId.isValid(cleanId)) {
      console.log(`[Admin Delete] Invalid ID format: "${cleanId}"`)
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 })
    }

    // Try deleting from both collections
    let deletedOrg = await Organization.findByIdAndDelete(cleanId)
    let type = 'Organization'
    
    if (deletedOrg) {
      console.log(`[Admin Delete] Found and deleted in Organization collection`)
    }

    if (!deletedOrg) {
      console.log(`[Admin Delete] Not found in Organization, checking PrivateOrg`)
      deletedOrg = await PrivateOrg.findByIdAndDelete(cleanId)
      type = 'PrivateOrg'
      if (deletedOrg) {
        console.log(`[Admin Delete] Found and deleted in PrivateOrg collection`)
      }
    }
    
    if (!deletedOrg) {
      console.log(`[Admin Delete] Organization not found in either collection`)
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 })
    }

    // Log action
    await AdminLog.create({
      adminId: null,
      adminEmail: process.env.ADMIN_EMAIL || 'admin@system.local',
      action: `Delete ${type}`,
      targetType: type,
      targetId: cleanId,
      details: { name: deletedOrg.name },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting organization:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete organization' }, { status: 500 })
  }
}
