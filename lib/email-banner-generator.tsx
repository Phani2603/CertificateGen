import { ImageResponse } from 'next/og'
import fs from 'fs'
import path from 'path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'certiflo'

export interface BannerStylingOptions {
  fontSize?: number | string;
  top?: number | string;
  left?: number | string;
}

/**
 * Creates an ImageResponse for the hero banner with the recipient's first name baked into the image.
 */
export function createBannerImageResponse(
  recipientName: string,
  options?: BannerStylingOptions
): ImageResponse {
  const firstName = recipientName ? recipientName.trim().split(' ')[0] : ''

  const bannerPath = path.join(process.cwd(), 'public', 'email-assets', 'hero-banner.png')
  const bannerBuffer = fs.readFileSync(bannerPath)
  const bannerBase64 = `data:image/png;base64,${bannerBuffer.toString('base64')}`

  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Outfit-Bold.ttf')
  const fontData = fs.readFileSync(fontPath)

  // Default coordinates at 1200x830 resolution (2x of 600x415)
  let topPx = 78
  let leftPx = 335
  let fontSizePx = 92

  if (options?.fontSize) {
    const parsed = parseInt(String(options.fontSize).replace('px', ''), 10)
    if (!isNaN(parsed) && parsed > 0) {
      fontSizePx = parsed <= 60 ? parsed * 2 : parsed
    }
  }

  if (options?.top) {
    const raw = String(options.top)
    if (raw.includes('%')) {
      const pct = parseFloat(raw.replace('%', ''))
      if (!isNaN(pct)) {
        topPx = Math.round((pct / 100) * 830)
      }
    } else {
      const parsed = parseInt(raw.replace('px', ''), 10)
      if (!isNaN(parsed)) topPx = parsed <= 150 ? parsed * 2 : parsed
    }
  }

  if (options?.left) {
    const raw = String(options.left)
    if (raw.includes('%')) {
      const pct = parseFloat(raw.replace('%', ''))
      if (!isNaN(pct)) {
        leftPx = Math.round((pct / 100) * 1200)
      }
    } else {
      const parsed = parseInt(raw.replace('px', ''), 10)
      if (!isNaN(parsed)) leftPx = parsed <= 300 ? parsed * 2 : parsed
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: '#00bf63',
        }}
      >
        <img
          src={bannerBase64}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1200px',
            height: '830px',
          }}
        />

        {firstName && (
          <div
            style={{
              position: 'absolute',
              top: `${topPx}px`,
              left: `${leftPx}px`,
              fontSize: `${fontSizePx}px`,
              fontWeight: 700,
              color: '#FFB04F',
              fontFamily: 'Outfit',
              display: 'flex',
              alignItems: 'center',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {firstName}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 830,
      fonts: [
        {
          name: 'Outfit',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  )
}

/**
 * Generates the banner PNG and uploads it to public S3, returning the direct HTTPS URL.
 * This guarantees Gmail, Outlook, and all clients can load the image regardless of localhost or domain changes.
 */
export async function uploadBannerToS3(
  recipientName: string,
  options?: BannerStylingOptions
): Promise<string> {
  const firstName = recipientName ? recipientName.trim().split(' ')[0] : 'Friend'
  const sanitizedName = firstName.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'candidate'
  const s3Key = `email-banners/${sanitizedName}.png`

  try {
    const imageResponse = createBannerImageResponse(firstName, options)
    const arrayBuffer = await imageResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: 'image/png',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    )

    const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`
    console.log(`[Email Banner] Uploaded dynamic banner to S3: ${s3Url}`)
    return s3Url
  } catch (error) {
    console.error('[Email Banner] Failed to upload banner to S3:', error)
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/email-assets/hero-banner.png`
  }
}
