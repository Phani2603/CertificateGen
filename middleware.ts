import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check for admin session
  const adminSession = request.cookies.get("admin-session")
  
  // Admin routes protection
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!adminSession || adminSession.value !== "true") {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }
  
  // Get session token from cookies
  const sessionToken = request.cookies.get("authjs.session-token") || 
                       request.cookies.get("__Secure-authjs.session-token")
  
  // Protected routes
  const protectedRoutes = ["/dashboard", "/individual-dashboard", "/create-organization", "/settings", "/api/certificates"]
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route)) ||
                          pathname.match(/^\/[\w-]+\/dashboard$/)
  
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
