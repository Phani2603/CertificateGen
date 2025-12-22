/**
 * Utility functions for certificate verification
 */

/**
 * Generate a short verification URL for display
 * @param verificationId - The unique certificate verification ID
 * @returns Shortened URL for display (e.g., "forge.app/v/abc123")
 */
export function getShortVerificationUrl(verificationId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const shortId = verificationId.substring(0, 8)
  return `${baseUrl}/verify/${verificationId}`.replace('http://', '').replace('https://', '')
}

/**
 * Generate full verification URL
 * @param verificationId - The unique certificate verification ID  
 * @returns Full verification URL
 */
export function getVerificationUrl(verificationId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return `${baseUrl}/verify/${verificationId}`
}

/**
 * Extract verification ID from URL
 * @param url - Full or partial verification URL
 * @returns Verification ID or null if invalid
 */
export function extractVerificationId(url: string): string | null {
  const match = url.match(/verify\/([a-f0-9-]+)/)
  return match ? match[1] : null
}

/**
 * Format verification code for display
 * @param verificationId - The unique certificate verification ID
 * @returns Formatted code (e.g., "CERT-ABC12345")
 */
export function formatVerificationCode(verificationId: string): string {
  return `CERT-${verificationId.substring(0, 8).toUpperCase()}`
}
