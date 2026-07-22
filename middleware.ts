import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import HmacSHA256 from "crypto-js/hmac-sha256"
import Hex from "crypto-js/enc-hex"

function verifyAdminSessionInEdge(value: string | undefined): boolean {
  if (!value) return false

  const secret = process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  const email = process.env.ADMIN_EMAIL?.trim()

  if (!secret || !email) return false

  const parts = value.split('.')
  if (parts.length !== 2) return false

  const [providedHash, timestamp] = parts
  if (!providedHash || !timestamp || Number.isNaN(Number(timestamp))) return false

  const expectedHash = HmacSHA256(`${email}:${timestamp}`, secret).toString(Hex)

  if (providedHash.length !== expectedHash.length) return false

  // Constant-time comparison in pure JS
  let result = 0
  for (let i = 0; i < providedHash.length; i++) {
    result |= providedHash.charCodeAt(i) ^ expectedHash.charCodeAt(i)
  }
  return result === 0
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check for admin session
  const adminSession = request.cookies.get("admin-session")
  
  // Admin routes protection
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!adminSession || !verifyAdminSessionInEdge(adminSession.value)) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  // Get session token from cookies
  const sessionToken = request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token")

  // Public routes that don't require authentication
  const publicApiRoutes = ["/api/certificates/verify"]
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))

  // Protected routes
  const protectedRoutes = ["/dashboard", "/individual-dashboard", "/create-organization", "/settings", "/api/certificates"]
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route)) ||
    pathname.match(/^\/[\w-]+\/dashboard$/)

  // If route is public API, allow access
  if (isPublicApiRoute) {
    return NextResponse.next()
  }

  // If route is protected and no session token, redirect to login
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/individual-dashboard/:path*",
    "/create-organization/:path*",
    "/api/certificates/:path*",
    "/settings/:path*",
    "/landing",
    "/:slug/dashboard"
  ],
}
