import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import AdminLog from '@/models/AdminLog'
import UserActivity from '@/models/UserActivity'
import { verifyAdminSessionValue } from '@/lib/admin-auth'

async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  return verifyAdminSessionValue(adminSession?.value)
}

async function logAdminAction({
  adminEmail,
  action,
  targetId,
  details,
}: {
  adminEmail: string
  action: string
  targetId: mongoose.Types.ObjectId
  details?: Record<string, any>
}) {
  await AdminLog.create({
    adminId: null,
    adminEmail,
    action,
    targetType: 'user',
    targetId,
    details,
  })
}

async function logUserActivity({
  userId,
  adminEmail,
  action,
  description,
  meta,
}: {
  userId: mongoose.Types.ObjectId
  adminEmail: string
  action: string
  description?: string
  meta?: Record<string, any>
}) {
  await UserActivity.create({
    userId,
    actorType: 'admin',
    actorEmail: adminEmail,
    action,
    category: 'admin',
    description,
    meta,
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@system.local'
    await connectDB()
    const { id } = await params
    const objectId = new mongoose.Types.ObjectId(id)
    const body = await request.json()
    const action = body?.action as string
    const reason = body?.reason as string | undefined
    const suspendUntil = body?.suspendUntil ? new Date(body.suspendUntil) : undefined

    const user = await User.findById(objectId)
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    switch (action) {
      case 'block': {
        user.isBlocked = true
        user.banReason = reason || 'Blocked by admin'
        user.bannedAt = new Date()
        await user.save()
        await logAdminAction({ adminEmail, action: 'USER_BLOCKED', targetId: objectId, details: { reason } })
        await logUserActivity({ userId: objectId, adminEmail, action: 'admin_block', description: 'User blocked by admin', meta: { reason } })
        return NextResponse.json({ success: true, message: 'User blocked' })
      }
      case 'unblock': {
        user.isBlocked = false
        user.banReason = undefined as any
        user.bannedAt = undefined as any
        await user.save()
        await logAdminAction({ adminEmail, action: 'USER_UNBLOCKED', targetId: objectId })
        await logUserActivity({ userId: objectId, adminEmail, action: 'admin_unblock', description: 'User unblocked by admin' })
        return NextResponse.json({ success: true, message: 'User unblocked' })
      }
      case 'suspend': {
        user.isSuspended = true
        user.suspendedUntil = suspendUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        user.banReason = reason || 'Suspended by admin'
        await user.save()
        await logAdminAction({ adminEmail, action: 'USER_SUSPENDED', targetId: objectId, details: { reason, suspendedUntil: user.suspendedUntil } })
        await logUserActivity({ userId: objectId, adminEmail, action: 'admin_suspend', description: 'User suspended by admin', meta: { reason, suspendedUntil: user.suspendedUntil } })
        return NextResponse.json({ success: true, message: 'User suspended', suspendedUntil: user.suspendedUntil })
      }
      case 'unsuspend': {
        user.isSuspended = false
        user.suspendedUntil = undefined as any
        await user.save()

        // Mark any pending appeals as resolved
        const SuspensionAppeal = (await import('@/models/SuspensionAppeal')).default
        await SuspensionAppeal.updateMany(
          { userId: objectId, status: 'pending' },
          {
            status: 'resolved',
            reviewedBy: adminEmail,
            reviewedAt: new Date(),
            adminResponse: 'Account unsuspended by admin'
          }
        )

        await logAdminAction({ adminEmail, action: 'USER_UNSUSPENDED', targetId: objectId })
        await logUserActivity({ userId: objectId, adminEmail, action: 'admin_unsuspend', description: 'User unsuspended by admin' })
        return NextResponse.json({ success: true, message: 'User unsuspended' })
      }
      case 'revoke-sessions': {
        await logAdminAction({ adminEmail, action: 'USER_SESSIONS_REVOKED', targetId: objectId })
        await logUserActivity({ userId: objectId, adminEmail, action: 'session_revoked', description: 'Admin revoked all sessions' })
        return NextResponse.json({ success: true, message: 'Sessions revoked (client should force re-auth)' })
      }
      case 'export-data': {
        const exported = {
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          phone: user.phone,
          bio: user.bio,
          organization: user.organization,
          provider: user.provider,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
        await logAdminAction({ adminEmail, action: 'USER_DATA_EXPORTED', targetId: objectId })
        await logUserActivity({ userId: objectId, adminEmail, action: 'data_export', description: 'Admin exported user data' })
        return NextResponse.json({ success: true, data: exported })
      }
      case 'delete': {
        await User.findByIdAndDelete(objectId)
        await logAdminAction({ adminEmail, action: 'USER_DELETED', targetId: objectId })
        await logUserActivity({ userId: objectId, adminEmail, action: 'admin_delete', description: 'User deleted by admin' })
        return NextResponse.json({ success: true, message: 'User deleted' })
      }
      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error performing admin action:', error)
    return NextResponse.json({ success: false, error: 'Failed to process action' }, { status: 500 })
  }
}
