import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

// Simple endpoint to convert existing users to individual type
// This can be called once to migrate all users
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Find all users with no userType
    const usersToMigrate = await User.find({
      $or: [
        { userType: { $exists: false } },
        { userType: null }
      ]
    })

    console.log(`Found ${usersToMigrate.length} users to migrate`)

    let migratedCount = 0

    for (const user of usersToMigrate) {
      user.userType = 'individual'
      await user.save()
      migratedCount++
    }

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${migratedCount} users to individual type`,
      migratedCount,
    })
  } catch (error) {
    console.error('[Migrate Users] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to migrate users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
