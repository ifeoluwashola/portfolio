import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if we're trying to access an /admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Exclude login and register from protection
    if (
      request.nextUrl.pathname === '/admin/login' ||
      request.nextUrl.pathname === '/admin/register'
    ) {
      return NextResponse.next();
    }

    // Check for auth token (In a real app this would typically be an HTTP-only cookie)
    // For this portfolio, we will check a standard cookie set by the frontend on successful login
    const token = request.cookies.get('auth_token');

    if (!token) {
      // No token, redirect to login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/admin/:path*',
};
