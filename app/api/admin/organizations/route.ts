import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectDB from '@/lib/mongodb'
import Organization from '@/models/Organization'
import PrivateOrg from '@/models/PrivateOrg'
import { verifyAdminSessionValue } from '@/lib/admin-auth'

// Helper to check admin auth
async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin-session')
  return verifyAdminSessionValue(adminSession?.value)
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'all' // 'academic', 'corporate', 'all'
    const search = searchParams.get('search') || ''

    let academicOrgs: any[] = []
    let corporateOrgs: any[] = []

    const searchRegex = search ? { name: { $regex: search, $options: 'i' } } : {}

    if (type === 'all' || type === 'academic') {
      academicOrgs = await Organization.find(searchRegex)
        .select('name type logoUrl members createdAt')
        .lean()
      // Add type field
      academicOrgs = academicOrgs.map(org => ({ ...org, orgType: 'academic' }))
    }

    if (type === 'all' || type === 'corporate') {
      corporateOrgs = await PrivateOrg.find(searchRegex)
        .select('name slug logoUrl allowedUsers createdAt isPublic')
        .lean()
      // Add type field
      corporateOrgs = corporateOrgs.map(org => ({ ...org, orgType: 'corporate' }))
    }

    // Combine and sort
    const allOrgs = [...academicOrgs, ...corporateOrgs].map(org => ({
      ...org,
      _id: org._id.toString(),
      createdAt: org.createdAt ? new Date(org.createdAt).toISOString() : new Date().toISOString()
    })).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({
      success: true,
      organizations: allOrgs
    })
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch organizations' }, { status: 500 })
  }
}
