import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Organization from '@/models/Organization'
import PrivateOrg from '@/models/PrivateOrg'
import AccessRequest from '@/models/AccessRequest'
import Event from '@/models/Event'
import CertificateHistory from '@/models/CertificateHistory'
import AdminLog from '@/models/AdminLog'
import mongoose from 'mongoose'
import { verifyAdminSessionValue } from '@/lib/admin-auth'

// Middleware to check admin authentication
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

    // Date range for growth chart (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
    twelveMonthsAgo.setDate(1)
    twelveMonthsAgo.setHours(0, 0, 0, 0)

    // Parallel Data Fetching
    const [
      totalUsers,
      totalOrganizations,
      totalPrivateOrgs,
      totalEvents,
      historyRecords, // For total certificates
      pendingRequests,

      // Aggregations
      userGrowthRaw,
      userTypeDistribution,
      providerStats,
      recentActivity
    ] = await Promise.all([
      User.countDocuments(),
      Organization.countDocuments(),
      PrivateOrg.countDocuments(),
      Event.countDocuments(),
      CertificateHistory.find(),
      AccessRequest.countDocuments({ status: 'pending' }),

      // 1. User Growth (Last 12 Months)
      User.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ]),

      // 2. User Type Distribution
      User.aggregate([
        {
          $group: {
            _id: "$userType",
            count: { $sum: 1 }
          }
        }
      ]),

      // 3. Provider Stats (Signup Method)
      User.aggregate([
        {
          $group: {
            _id: "$provider",
            count: { $sum: 1 }
          }
        }
      ]),

      // 4. Recent Activity Logs
      AdminLog.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('adminId', 'name image') // Assuming AdminLog has adminId ref to User
        .lean()
    ])

    // Process History Records for Total Certificates
    const totalCertificates = historyRecords.reduce((sum, record: any) => {
      return sum + (record.certificateCount || 0)
    }, 0)

    // Process User Growth Data (Fill missing months with 0)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyUserGrowth = [];
    let currentDate = new Date(twelveMonthsAgo);
    const now = new Date();

    while (currentDate <= now) {
      const yearMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM
      const monthName = monthNames[currentDate.getMonth()];

      const found = userGrowthRaw.find((item: any) => item._id === yearMonth);
      monthlyUserGrowth.push({
        name: monthName,
        users: found ? found.count : 0
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Process User Type Distribution
    const processedUserType = userTypeDistribution.map((item: any) => ({
      name: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : 'Unassigned',
      value: item.count
    }));

    // Process Provider Stats
    const processedProviderStats = providerStats.map((item: any) => ({
      name: item._id === 'credentials' ? 'Email/Password' : (item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : 'Unknown'),
      value: item.count
    }));


    // Check System Status
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    const s3Status = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION && process.env.AWS_S3_BUCKET_NAME ? 'configured' : 'missing_config'

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        individualUsers: userTypeDistribution.find((x: any) => x._id === 'individual')?.count || 0,
        corporateUsers: userTypeDistribution.find((x: any) => x._id === 'corporate')?.count || 0,
        academicUsers: userTypeDistribution.find((x: any) => x._id === 'academic')?.count || 0,
        pendingRequests,
        totalOrganizations,
        totalPrivateOrgs,
        totalEvents,
        totalCertificates,
        recentActivity,

        // System Status
        systemStatus: {
          database: dbStatus,
          s3: s3Status
        },

        // Chart Data
        monthlyUserGrowth,
        userTypeDistribution: processedUserType,
        providerStats: processedProviderStats
      },
    })
  } catch (error) {
    console.error('[Admin Stats] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
