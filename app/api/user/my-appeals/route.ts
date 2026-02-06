import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import SuspensionAppeal from '@/models/SuspensionAppeal'

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

        // Fetch user's appeals
        const appeals = await SuspensionAppeal.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean()

        return NextResponse.json({
            success: true,
            appeals,
        })
    } catch (error) {
        console.error('Error fetching user appeals:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch appeals' },
            { status: 500 }
        )
    }
}
