import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'f3f69f575fb66decd770be4b6af4f36a393ccf16'
);

export async function middleware(request: NextRequest) {
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

    try {
      const { payload } = await jwtVerify(studentToken.value, JWT_SECRET);
      
      // If student is disqualified, block all dashboard access
      if (payload.status === 'disqualified') {
        return NextResponse.redirect(new URL('/academy/access-revoked', request.url));
      }
    } catch (err) {
      console.error('Middleware JWT Error:', err);
      return NextResponse.redirect(new URL('/academy/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/academy/dashboard/:path*'],
};
