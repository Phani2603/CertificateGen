import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import PrivateOrg from '@/models/PrivateOrg'
import User from '@/models/User'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const privateOrg = await PrivateOrg.findById(params.id)
    
    if (!privateOrg) {
      return NextResponse.json(
        { success: false, error: 'Private organization not found' },
        { status: 404 }
      )
    }

    // Check if user has access
    const hasAccess = 
      privateOrg.ownerId.toString() === user._id.toString() ||
      privateOrg.allowedUsers.some((userId: any) => userId.toString() === user._id.toString())

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      privateOrg: {
        _id: privateOrg._id,
        name: privateOrg.name,
        slug: privateOrg.slug,
        description: privateOrg.description,
        logoUrl: privateOrg.logoUrl,
        website: privateOrg.website,
        ownerId: privateOrg.ownerId,
        allowedUsers: privateOrg.allowedUsers,
        isPublic: privateOrg.isPublic,
        createdAt: privateOrg.createdAt,
        updatedAt: privateOrg.updatedAt,
      }
    })
  } catch (error) {
    console.error('Error fetching private org:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch private organization' },
      { status: 500 }
    )
  }
}
