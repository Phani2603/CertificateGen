import crypto from 'crypto'

const ADMIN_SESSION_COOKIE_NAME = 'admin-session'

function getAdminSessionSecret(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
}

function getAdminEmail(): string | undefined {
  return process.env.ADMIN_EMAIL?.trim()
}

export function createAdminSessionValue(email: string, secret: string, timestamp = Date.now()): string {
  const payload = `${email}:${timestamp}`
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `${hash}.${timestamp}`
}

export function verifyAdminSessionValue(value: string | undefined): boolean {
  if (!value) {
    return false
  }

  const secret = getAdminSessionSecret()
  const email = getAdminEmail()

  if (!secret || !email) {
    return false
  }

  const parts = value.split('.')
  if (parts.length !== 2) {
    return false
  }

  const [providedHash, timestamp] = parts
  if (!providedHash || !timestamp || Number.isNaN(Number(timestamp))) {
    return false
  }

  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(`${email}:${timestamp}`)
    .digest('hex')

  const providedBuffer = Buffer.from(providedHash, 'hex')
  const expectedBuffer = Buffer.from(expectedHash, 'hex')

  if (providedBuffer.length !== expectedBuffer.length) {
    return false
  }

  try {
    return crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  } catch {
    return false
  }
}

export async function setAdminSessionCookie(cookieStore: { set: (name: string, value: string, options: Record<string, unknown>) => void }) {
  const secret = getAdminSessionSecret()
  const email = getAdminEmail()

  if (!secret || !email) {
    throw new Error('Admin session secret is not configured')
  }

  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, createAdminSessionValue(email, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })
}

export async function clearAdminSessionCookie(cookieStore: { delete: (name: string) => void }) {
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME)
}

export async function isValidAdminSessionCookie() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  return verifyAdminSessionValue(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value)
}
