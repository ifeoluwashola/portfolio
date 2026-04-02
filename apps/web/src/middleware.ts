import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routing check
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login' || pathname === '/admin/register') {
      return NextResponse.next();
    }
    const token = request.cookies.get('auth_token');
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Student portal routing check
  if (pathname.startsWith('/academy/dashboard')) {
    const studentToken = request.cookies.get('academy_token');
    if (!studentToken) {
      return NextResponse.redirect(new URL('/academy/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/academy/dashboard/:path*'],
};
