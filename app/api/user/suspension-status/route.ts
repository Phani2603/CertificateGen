import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

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

        const user = await User.findOne({ email: session.user.email }).select('isSuspended suspendedUntil banReason')

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            )
        }

        // Check if suspension has expired
        if (user.isSuspended && user.suspendedUntil && new Date(user.suspendedUntil) < new Date()) {
            user.isSuspended = false
            user.suspendedUntil = undefined as any
            user.banReason = undefined as any
            await user.save()

            return NextResponse.json({
                success: true,
                isSuspended: false,
            })
        }

        return NextResponse.json({
            success: true,
            isSuspended: user.isSuspended || false,
            suspendedUntil: user.suspendedUntil,
            reason: user.banReason,
        })
    } catch (error) {
        console.error('Error checking suspension status:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to check suspension status' },
            { status: 500 }
        )
    }
}
