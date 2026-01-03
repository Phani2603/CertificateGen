import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!
const PREFIX = process.env.AWS_S3_PREFIX || 'certificate-templates/'

// Debug: Log S3 configuration on module load
console.log('[S3 Service] Configuration:', {
  bucket: BUCKET_NAME,
  prefix: PREFIX,
  region: process.env.AWS_REGION,
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
})

/**
 * Upload a certificate template to S3
 * @param file - Image file buffer
 * @param organizationId - Organization ID
 * @param eventId - Event ID
 * @param fileName - Original file name (for extension)
 * @returns S3 key of the uploaded file
 */
export async function uploadTemplate(
  file: Buffer,
  organizationId: string,
  eventId: string,
  fileName: string
): Promise<string> {
  console.log('[S3 Upload] Starting upload:', {
    organizationId,
    eventId,
    fileName,
    fileSize: file.length,
  })
  
  const timestamp = Date.now()
  const extension = fileName.split('.').pop() || 'png'
  const key = `${PREFIX}${organizationId}/${eventId}/template-${timestamp}.${extension}`
  
  console.log('[S3 Upload] Generated S3 key:', key)

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: `image/${extension}`,
    // Optional: Add metadata for better tracking
    Metadata: {
      organizationId,
      eventId,
      uploadedAt: new Date().toISOString(),
    },
  })

  try {
    console.log('[S3 Upload] Sending PutObjectCommand to S3...')
    await s3Client.send(command)
    console.log(`[S3 Upload] ✅ SUCCESS - Template uploaded: ${key}`)
    return key
  } catch (error) {
    console.error('[S3 Upload] ❌ ERROR:', error)
    console.error('[S3 Upload] Error details:', {
      bucket: BUCKET_NAME,
      key,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })
    throw new Error('Failed to upload template to S3')
  }
}

/**
 * Generate a signed URL for secure template access
 * @param s3Key - S3 object key
 * @param expiresIn - URL expiry time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export async function getSignedTemplateUrl(
  s3Key: string,
  expiresIn: number = 3600
): Promise<string> {
  console.log('[S3 Signed URL] Generating URL for:', s3Key)
  
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  })

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })
    console.log('[S3 Signed URL] ✅ Generated (expires in', expiresIn, 'seconds)')
    return signedUrl
  } catch (error) {
    console.error('[S3 Signed URL] ❌ ERROR:', error)
    throw new Error('Failed to generate signed URL')
  }
}

/**
 * List all templates for an organization
 * @param organizationId - Organization ID
 * @returns Array of template objects with S3 keys and metadata
 */
export async function listOrgTemplates(organizationId: string): Promise<
  Array<{
    key: string
    fileName: string
    size: number
    lastModified: Date
  }>
> {
  console.log('[S3 List] Listing templates for organization:', organizationId)
  console.log('[S3 List] Search prefix:', `${PREFIX}${organizationId}/`)
  
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: `${PREFIX}${organizationId}/`,
    MaxKeys: 100, // Limit for performance
  })

  try {
    const response = await s3Client.send(command)
    console.log('[S3 List] Response received, objects found:', response.Contents?.length || 0)
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('[S3 List] No templates found')
      return []
    }

    const templates = response.Contents.map((object) => ({
      key: object.Key!,
      fileName: object.Key!.split('/').pop() || 'template',
      size: object.Size || 0,
      lastModified: object.LastModified || new Date(),
    }))
    
    console.log('[S3 List] ✅ Returning', templates.length, 'templates')
    return templates
  } catch (error) {
    console.error('[S3 List] ❌ ERROR:', error)
    throw new Error('Failed to list templates')
  }
}

/**
 * Check if S3 service is properly configured
 * @returns true if configured, false otherwise
 */
export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION &&
    process.env.AWS_S3_BUCKET_NAME
  )
}
