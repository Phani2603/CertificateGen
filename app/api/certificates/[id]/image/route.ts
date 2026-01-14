import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Certificate from '@/models/Certificate'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()

    const certificate = await Certificate.findById(params.id)

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      )
    }

    // If certificate has an S3 key, fetch from S3
    if (certificate.templateS3Key) {
      try {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME || '',
          Key: certificate.templateS3Key,
        })

        const response = await s3Client.send(command)
        
        if (response.Body) {
          const imageBuffer = Buffer.from(await response.Body.transformToByteArray())
          
          return new NextResponse(imageBuffer, {
            headers: {
              'Content-Type': response.ContentType || 'image/png',
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          })
        }
      } catch (s3Error) {
        console.error('Error fetching from S3:', s3Error)
      }
    }

    // Fallback: return a placeholder image or the default template
    return NextResponse.json(
      { error: 'Certificate image not available' },
      { status: 404 }
    )

  } catch (error) {
    console.error('Error fetching certificate image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
