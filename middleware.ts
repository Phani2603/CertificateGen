import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get session token from cookies
  const sessionToken = request.cookies.get("authjs.session-token") || 
                       request.cookies.get("__Secure-authjs.session-token")
  
  // Protected routes
  const protectedRoutes = ["/dashboard", "/settings", "/api/certificates"]
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // If route is protected and no session token, redirect to login
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // If user is logged in and tries to access landing page, redirect to dashboard
  if (pathname === "/landing" && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/certificates/:path*",
    "/settings/:path*",
    "/landing",
  ],
}
