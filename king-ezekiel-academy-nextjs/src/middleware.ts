import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Define protected routes
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/achievements',
    '/subscription',
    '/diploma',
    '/certificates',
    '/assessments',
    '/resume',
    '/rooms',
    '/affiliates'
  ]

  // Define admin routes
  const adminRoutes = [
    '/admin'
  ]

  // Define course routes that need authentication
  const courseRoutes = [
    '/course'
  ]

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isCourseRoute = courseRoutes.some(route => pathname.startsWith(route))

  // For now, let the client-side components handle authentication
  // This middleware will be enhanced later with server-side session checking
  if (isProtectedRoute || isCourseRoute || isAdminRoute) {
    // Let the ProtectedRoute and AdminRoute components handle the authentication
    // This prevents the middleware from blocking the initial page load
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
