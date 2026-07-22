import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { S3Client, HeadBucketCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import connectDB from '@/lib/mongodb'
import Event from '@/models/Event'
import Certificate from '@/models/Certificate'
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const region = process.env.AWS_REGION || ''
    const bucketName = process.env.AWS_S3_BUCKET_NAME || ''
    const prefix = process.env.AWS_S3_PREFIX || 'certificate-templates/'
    const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID
    const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY

    // S3 Health Check
    let s3Connected = false
    let s3Error: string | null = null

    if (hasAccessKey && hasSecretKey && region && bucketName) {
      const s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      })

      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
        s3Connected = true
      } catch (err) {
        s3Error = err instanceof Error ? err.message : 'Failed to connect to S3 bucket'
        console.error('[Admin S3] HeadBucket error:', s3Error)
      }
    } else {
      s3Error = 'Missing S3 configuration. Check AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME.'
    }

    // Template Inventory
    await connectDB()

    // Get all unique S3 keys from Events
    const events = await Event.find(
      { templateS3Key: { $exists: true, $ne: null } },
      'name templateS3Key privateOrgId organizationId'
    ).lean()

    // Get all unique S3 keys from Certificates not already in events
    const certificates = await Certificate.find(
      { templateS3Key: { $exists: true, $ne: null } },
      'eventName templateS3Key eventId'
    ).lean()

    // Build deduplicated template map
    const templateMap = new Map<string, {
      s3Key: string
      eventNames: string[]
      eventIds: string[]
      source: 'event' | 'certificate' | 'both'
      status: 'available' | 'missing' | 'unchecked'
    }>()

    for (const event of events) {
      const key = event.templateS3Key as string
      if (!templateMap.has(key)) {
        templateMap.set(key, {
          s3Key: key,
          eventNames: [event.name],
          eventIds: [String(event._id)],
          source: 'event',
          status: 'unchecked',
        })
      } else {
        const entry = templateMap.get(key)!
        if (!entry.eventNames.includes(event.name)) {
          entry.eventNames.push(event.name)
        }
        if (!entry.eventIds.includes(String(event._id))) {
          entry.eventIds.push(String(event._id))
        }
      }
    }

    for (const cert of certificates) {
      const key = cert.templateS3Key as string
      if (!templateMap.has(key)) {
        templateMap.set(key, {
          s3Key: key,
          eventNames: [cert.eventName || 'Unknown'],
          eventIds: cert.eventId ? [String(cert.eventId)] : [],
          source: 'certificate',
          status: 'unchecked',
        })
      } else {
        const entry = templateMap.get(key)!
        if (entry.source === 'event') entry.source = 'both'
        const name = cert.eventName || 'Unknown'
        if (!entry.eventNames.includes(name)) {
          entry.eventNames.push(name)
        }
      }
    }

    // Check S3 availability for each key (only if S3 is connected)
    if (s3Connected) {
      const s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      })

      const checkPromises = Array.from(templateMap.entries()).map(async ([key, entry]) => {
        try {
          await s3Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }))
          entry.status = 'available'
        } catch {
          entry.status = 'missing'
        }
      })

      await Promise.all(checkPromises)
    }

    const templates = Array.from(templateMap.values())

    // Count certificates per S3 key for impact assessment
    const certCounts: Record<string, number> = {}
    for (const key of templateMap.keys()) {
      const count = await Certificate.countDocuments({ templateS3Key: key })
      certCounts[key] = count
    }

    return NextResponse.json({
      success: true,
      health: {
        connected: s3Connected,
        error: s3Error,
        region,
        bucket: bucketName,
        prefix,
        hasAccessKey,
        hasSecretKey,
      },
      templates: templates.map(t => ({
        ...t,
        affectedCertificates: certCounts[t.s3Key] || 0,
      })),
      summary: {
        totalUniqueKeys: templates.length,
        available: templates.filter(t => t.status === 'available').length,
        missing: templates.filter(t => t.status === 'missing').length,
        unchecked: templates.filter(t => t.status === 'unchecked').length,
      },
    })
  } catch (error) {
    console.error('[Admin S3] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
