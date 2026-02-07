import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Event from '@/models/Event'
import Certificate from '@/models/Certificate'
import UserActivity from '@/models/UserActivity'
import Organization from '@/models/Organization'

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

    // Fetch events created by user
    const eventsCount = await Event.countDocuments({ createdBy: user._id })
    
    // Fetch certificates for user's email
    const certificatesCount = await Certificate.countDocuments({ 
      recipientEmail: user.email 
    })
    
    // Fetch organizations count (clubs + privateorgs user is part of)
    const PrivateOrg = (await import('@/models/PrivateOrg')).default
    const privateOrgsCount = await PrivateOrg.countDocuments({
      $or: [
        { ownerId: user._id },
        { allowedUsers: user._id }
      ]
    })
    
    // Get team size from privateOrg if user has one
    let teamSize = 1 // Default to 1 (just the user)
    if (user.privateOrgId) {
      const privateOrg = await PrivateOrg.findById(user.privateOrgId)
      if (privateOrg) {
        teamSize = privateOrg.allowedUsers?.length || 1
      }
    }
    
    const organizationsCount = privateOrgsCount + (user.clubs?.length || 0)
    
    console.log('[Stats API] Organization count:', {
      userId: user._id,
      privateOrgsCount,
      clubsCount: user.clubs?.length || 0,
      totalOrganizations: organizationsCount,
      teamSize
    })
    
    // Fetch achievements (for now, using a formula based on events and certs)
    const achievementsCount = Math.floor((eventsCount * 2 + certificatesCount) / 3)
    
    // Check if user is currently suspended
    const suspensionsCount = user.isSuspended ? 1 : 0
    
    // Fetch recent activity for the user
    const recentActivity = await UserActivity.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
    
    // Calculate profile completion
    let profileCompletion = 0
    if (user.name) profileCompletion += 20
    if (user.email) profileCompletion += 20
    if (user.image) profileCompletion += 15
    if (user.phone) profileCompletion += 15
    if (user.bio) profileCompletion += 10
    if (user.address) profileCompletion += 10
    if (user.clubs && user.clubs.length > 0) profileCompletion += 10
    
    // Calculate trust score based on activity and account status
    let trustScore = 'Medium'
    const accountAge = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24) // days
    const activityScore = eventsCount * 2 + certificatesCount + organizationsCount * 3
    
    if (user.isSuspended || user.isBlocked) {
      trustScore = 'Low'
    } else if (accountAge > 180 && activityScore > 50) {
      trustScore = 'High'
    } else if (accountAge > 90 && activityScore > 20) {
      trustScore = 'Medium'
    } else {
      trustScore = 'Low'
    }
    
    // Get last active time - pass ISO string for relative time calculation
    const lastActive = recentActivity.length > 0 
      ? new Date(recentActivity[0].createdAt).toISOString()
      : 'Never'
    
    // Calculate statistics for trends
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const fourMonthsAgo = new Date()
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4)
    
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    
    // Events trend (last 6 months vs previous 6 months)
    const recentEvents = await Event.countDocuments({ 
      createdBy: user._id,
      createdAt: { $gte: sixMonthsAgo }
    })
    const previousEvents = await Event.countDocuments({ 
      createdBy: user._id,
      createdAt: { 
        $gte: new Date(sixMonthsAgo.getTime() - 6 * 30 * 24 * 60 * 60 * 1000),
        $lt: sixMonthsAgo
      }
    })
    const eventsTrend = previousEvents > 0 
      ? Math.round(((recentEvents - previousEvents) / previousEvents) * 100)
      : recentEvents > 0 ? 100 : 0
    
    // Certificates trend (last 4 months vs previous 4 months)
    const recentCerts = await Certificate.countDocuments({ 
      recipientEmail: user.email,
      createdAt: { $gte: fourMonthsAgo }
    })
    const previousCerts = await Certificate.countDocuments({ 
      recipientEmail: user.email,
      createdAt: { 
        $gte: new Date(fourMonthsAgo.getTime() - 4 * 30 * 24 * 60 * 60 * 1000),
        $lt: fourMonthsAgo
      }
    })
    const certsTrend = previousCerts > 0 
      ? Math.round(((recentCerts - previousCerts) / previousCerts) * 100)
      : recentCerts > 0 ? 100 : 0
    
    // Organizations trend (simplified)
    const orgsTrend = -8 // Mock for now
    
    // Achievements trend
    const achievementsTrend = Math.round((eventsTrend + certsTrend) / 2)
    
    // Weekly certificate data (last 7 days)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    
    const weeklyData = []
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(sevenDaysAgo)
      currentDay.setDate(currentDay.getDate() + i)
      const nextDay = new Date(currentDay)
      nextDay.setDate(nextDay.getDate() + 1)
      
      const dayCount = await Certificate.countDocuments({
        recipientEmail: user.email,
        createdAt: {
          $gte: currentDay,
          $lt: nextDay
        }
      })
      
      weeklyData.push({
        day: dayNames[currentDay.getDay()],
        count: dayCount
      })
    }

    return NextResponse.json({
      success: true,
      stats: {
        events: {
          count: eventsCount,
          trend: eventsTrend,
          period: 'Last 6 months'
        },
        certificates: {
          count: certificatesCount,
          trend: certsTrend,
          period: 'Last 4 months'
        },
        organizations: {
          count: organizationsCount,
          trend: orgsTrend,
          period: 'Last One year',
          teamSize: teamSize
        },
        achievements: {
          count: achievementsCount,
          trend: achievementsTrend,
          period: 'Last 6 months'
        },
        suspensions: {
          count: suspensionsCount
        }
      },
      userProfile: {
        name: user.name,
        email: user.email,
        image: user.image,
        accountType: user.userType || 'individual',
        joinedDate: user.createdAt,
        userId: user._id,
        profileCompletion,
        trustScore,
        lastActive
      },
      weeklyData,
      recentActivity: recentActivity.map(activity => ({
        _id: activity._id,
        action: activity.action,
        category: activity.category,
        description: activity.description,
        createdAt: activity.createdAt
      }))
    })
  } catch (error) {
    console.error('[Dashboard Stats API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard stats',
      },
      { status: 500 }
    )
  }
}
