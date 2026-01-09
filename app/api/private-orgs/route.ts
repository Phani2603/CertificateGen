import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import PrivateOrg from '@/models/PrivateOrg'
import User from '@/models/User'
import { auth } from '@/auth'

// Security: Sanitize input to prevent NoSQL injection
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  // Remove potential NoSQL operators but keep valid characters
  return input
    .replace(/\$/g, '') // Remove $ which is MongoDB operator
    .trim()
    .slice(0, 500) // Increased limit for descriptions
}

// Security: Validate URL format
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

// Security: Normalize name for comparison (remove numbers, spaces, special chars)
function normalizeNameForComparison(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s\-_0-9]/g, '') // Remove spaces, dashes, underscores, numbers
    .replace(/[^a-z]/g, '') // Keep only letters
}

// GET all organizations for the current user
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

    // Find organizations where user is owner or in allowedUsers
    const organizations = await PrivateOrg.find({
      $or: [
        { ownerId: user._id },
        { allowedUsers: user._id }
      ]
    })
      .select('name slug description logoUrl isPublic ownerId createdAt')
      .lean()

    return NextResponse.json({
      success: true,
      organizations,
    })
  } catch (error) {
    console.error('[Private Orgs] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch organizations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST create a new organization
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

    if (user.userType !== 'corporate') {
      return NextResponse.json(
        { success: false, error: 'Only corporate users can create organizations' },
        { status: 403 }
      )
    }

    const body = await request.json()
    let { name, description, website, isPublic } = body

    // Security: Sanitize all inputs
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Organization name is required' },
        { status: 400 }
      )
    }

    name = sanitizeInput(name)
    description = description ? sanitizeInput(description) : ''
    
    // Validate and sanitize website URL
    if (website && typeof website === 'string') {
      website = website.trim()
      if (website && !isValidUrl(website)) {
        return NextResponse.json(
          { success: false, error: 'Invalid website URL format' },
          { status: 400 }
        )
      }
    }

    // Security: Check name length
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Organization name must be between 2 and 100 characters' },
        { status: 400 }
      )
    }

    // Security: Check for malicious patterns
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /\$where/i,
      /\$regex/i,
    ]
    
    if (maliciousPatterns.some(pattern => pattern.test(name) || pattern.test(description))) {
      return NextResponse.json(
        { success: false, error: 'Invalid characters detected in input' },
        { status: 400 }
      )
    }

    // Check for restricted keywords (unless user is admin)
    const restrictedKeywords = ['admin', 'official', 'system']
    const normalizedName = name.toLowerCase().replace(/[\s-_]/g, '')
    const hasRestrictedKeyword = restrictedKeywords.some(keyword => 
      normalizedName.includes(keyword.replace(/[\s-_]/g, ''))
    )

    if (hasRestrictedKeyword) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'This organization name contains restricted keywords',
          code: 'RESTRICTED_NAME',
          message: `Organization names containing restricted keywords require admin approval. Please contact our team at forge@senement.com for assistance.`
        },
        { status: 403 }
      )
    }

    await connectDB()

    // Check for exact duplicate organization name (case-insensitive)
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const existingOrg = await PrivateOrg.findOne({ 
      name: { $regex: new RegExp(`^${escapedName}$`, 'i') } 
    })

    if (existingOrg) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Organization name already exists',
          code: 'DUPLICATE_NAME',
          message: `An organization with the name "${name}" already exists. Please choose a different name or contact our team if you believe this is your organization.`
        },
        { status: 409 }
      )
    }

    // Check for similar names (preventing variations with numbers/special chars)
    // e.g., if "TechCorp" exists, block "TechCorp123", "Tech_Corp", "Tech-Corp-2024"
    const normalizedInputName = normalizeNameForComparison(name)
    
    if (normalizedInputName.length >= 3) { // Only check if meaningful base name
      const allOrgs = await PrivateOrg.find({}).select('name').lean()
      
      const similarOrg = allOrgs.find(org => {
        const normalizedExistingName = normalizeNameForComparison(org.name)
        // Check if base names match (ignoring numbers and special chars)
        return normalizedExistingName === normalizedInputName && 
               org.name.toLowerCase() !== name.toLowerCase() // Not exact same
      })

      if (similarOrg) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Similar organization name already exists',
            code: 'SIMILAR_NAME',
            message: `An organization with a similar name "${similarOrg.name}" already exists. Variations with numbers or special characters are not allowed. Please contact admin team at forge@senement.com if you believe you should have access to this name.`
          },
          { status: 409 }
        )
      }
    }

    // Check for duplicate organization name (case-insensitive)

    if (existingOrg) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Organization name already exists',
          code: 'DUPLICATE_NAME',
          message: `An organization with the name "${name}" already exists. Please choose a different name or contact our team if you believe this is your organization.`
        },
        { status: 409 }
      )
    }

    // Generate unique slug
    const slug = await PrivateOrg.generateSlug(name)

    // Create organization
    const organization = await PrivateOrg.create({
      name,
      slug,
      description,
      website,
      isPublic: isPublic || false,
      ownerId: user._id,
      allowedUsers: [user._id],
    })

    // Update user's privateOrgId
    user.privateOrgId = organization._id
    await user.save()

    return NextResponse.json({
      success: true,
      organization: {
        _id: organization._id,
        name: organization.name,
        slug: organization.slug,
      },
    })
  } catch (error) {
    console.error('[Private Orgs Create] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create organization',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
