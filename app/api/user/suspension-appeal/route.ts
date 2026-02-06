import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import SuspensionAppeal from '@/models/SuspensionAppeal'

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

        if (!user.isSuspended) {
            return NextResponse.json(
                { success: false, error: 'User is not suspended' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { message } = body

        if (!message || message.trim().length < 10) {
            return NextResponse.json(
                { success: false, error: 'Please provide a detailed message (at least 10 characters)' },
                { status: 400 }
            )
        }

        // Check if user already has a pending appeal
        const existingAppeal = await SuspensionAppeal.findOne({
            userId: user._id,
            status: 'pending',
        })

        if (existingAppeal) {
            return NextResponse.json(
                { success: false, error: 'You already have a pending appeal. Please wait for admin review.' },
                { status: 400 }
            )
        }

        // Create new appeal
        const appeal = await SuspensionAppeal.create({
            userId: user._id,
            userEmail: user.email,
            userName: user.name,
            message: message.trim(),
            status: 'pending',
        })

        return NextResponse.json({
            success: true,
            message: 'Your appeal has been submitted successfully. Our team will review it shortly.',
            appeal: {
                _id: appeal._id,
                message: appeal.message,
                createdAt: appeal.createdAt,
            },
        })
    } catch (error) {
        console.error('Error submitting suspension appeal:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to submit appeal' },
            { status: 500 }
        )
    }
}
