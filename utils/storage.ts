import type { CertificateField } from "@/types/certificate"

export interface SessionData {
  csvData: Array<Record<string, string>>
  csvHeaders: string[]
  fieldMapping: Record<string, string>
  generatedCertificates: Array<{
    email: string
    name: string
    certificateBlobBase64: string
    fileName: string
  }>
  currentStep: number
  emailProvider: "resend" | "gmail"
  sendingMode: "auto" | "sequential" | "pooled"
  outputFormat: "png" | "pdf"
  quality: "standard" | "high"
  templateImage: string // Keep for backward compatibility (base64 or S3 URL)
  templateS3Key?: string // NEW: Store S3 key separately
  fields: CertificateField[]
  timestamp: number
}

const STORAGE_KEY_PREFIX = "cert-generator-session"
const MAX_STORAGE_AGE = 24 * 60 * 60 * 1000 // 24 hours

function getStorageKey(eventId?: string): string {
  return eventId ? `${STORAGE_KEY_PREFIX}-${eventId}` : STORAGE_KEY_PREFIX
}

export function saveSession(data: Partial<SessionData>, eventId?: string) {
  try {
    const key = getStorageKey(eventId)
    const existing = loadSession(eventId)
    const updated = { ...existing, ...data, timestamp: Date.now() }
    localStorage.setItem(key, JSON.stringify(updated))
  } catch (error) {
    console.warn("Failed to save session:", error)
  }
}

export function loadSession(eventId?: string): Partial<SessionData> {
  try {
    const key = getStorageKey(eventId)
    const data = localStorage.getItem(key)
    if (!data) return {}

    const parsed = JSON.parse(data)

    // Clear old sessions (older than 24 hours)
    if (Date.now() - (parsed.timestamp || 0) > MAX_STORAGE_AGE) {
      clearSession(eventId)
      return {}
    }

    return parsed
  } catch (error) {
    console.warn("Failed to load session:", error)
    return {}
  }
}

export function clearSession(eventId?: string) {
  try {
    const key = getStorageKey(eventId)
    localStorage.removeItem(key)
    console.log(`[Storage] Cleared session for ${eventId || 'default'}`)
  } catch (error) {
    console.warn("Failed to clear session:", error)
  }
}

export function hasValidSession(eventId?: string): boolean {
  const session = loadSession(eventId)
  return (
    Object.keys(session).length > 0 &&
    Date.now() - (session.timestamp || 0) < MAX_STORAGE_AGE
  )
}

// Helper function to convert Blob to base64
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      // Remove the data:image/png;base64, prefix
      resolve(base64.split(",")[1] || base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Helper function to convert base64 to Blob
export function base64ToBlob(base64: string, type = "image/png"): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type })
}
