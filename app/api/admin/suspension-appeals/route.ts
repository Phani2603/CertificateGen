import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectDB from '@/lib/mongodb'
import SuspensionAppeal from '@/models/SuspensionAppeal'
import { verifyAdminSessionValue } from '@/lib/admin-auth'

async function checkAdminAuth() {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin-session')
    return verifyAdminSessionValue(adminSession?.value)
}

export async function GET(request: NextRequest) {
    try {
        const isAdmin = await checkAdminAuth()
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        await connectDB()

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || 'pending'
        const userId = searchParams.get('userId')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = parseInt(searchParams.get('skip') || '0')

        const query: any = {}
        if (status && status !== 'all') {
            query.status = status
        }
        if (userId) {
            query.userId = userId
        }

        const appeals = await SuspensionAppeal.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean()

        const total = await SuspensionAppeal.countDocuments(query)

        return NextResponse.json({
            success: true,
            appeals,
            total,
            hasMore: skip + appeals.length < total,
        })
    } catch (error) {
        console.error('Error fetching suspension appeals:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch appeals' },
            { status: 500 }
        )
    }
}
