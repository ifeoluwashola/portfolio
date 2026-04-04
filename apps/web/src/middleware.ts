import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// JWT_SECRET must be set in environment — no hardcoded fallback
const JWT_SECRET_RAW = process.env.JWT_SECRET;

function getJWTSecret(): Uint8Array {
  if (!JWT_SECRET_RAW) {
    console.error('FATAL: JWT_SECRET environment variable is not set');
    throw new Error('JWT_SECRET is required');
  }
  return new TextEncoder().encode(JWT_SECRET_RAW);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ===== ADMIN ROUTING =====
  if (pathname.startsWith('/admin')) {
    // Public admin routes (no auth needed)
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const token = request.cookies.get('auth_token');
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const secret = getJWTSecret();
      const { payload } = await jwtVerify(token.value, secret);

      // Verify this is an admin token
      if (payload.type !== 'admin') {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      // If first login, force password change (unless already on that page)
      if (payload.is_first_login === true && pathname !== '/admin/change-password') {
        // Allow the change-password page itself
        return NextResponse.redirect(new URL('/admin/change-password', request.url));
      }

      // Block first-login users from accessing anything except change-password
      // (handled above — they get redirected)

    } catch (err) {
      console.error('Admin JWT verification failed:', err);
      // Clear invalid cookie and redirect
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // ===== STUDENT PORTAL ROUTING =====
  if (pathname.startsWith('/academy/dashboard')) {
    const studentToken = request.cookies.get('academy_token');
    if (!studentToken) {
      return NextResponse.redirect(new URL('/academy/login', request.url));
    }

    try {
      const secret = getJWTSecret();
      const { payload } = await jwtVerify(studentToken.value, secret);
      
      // If student is disqualified, block all dashboard access
      if (payload.status === 'disqualified') {
        return NextResponse.redirect(new URL('/academy/access-revoked', request.url));
      }
    } catch (err) {
      console.error('Student JWT verification failed:', err);
      const response = NextResponse.redirect(new URL('/academy/login', request.url));
      response.cookies.delete('academy_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/academy/dashboard/:path*'],
};
