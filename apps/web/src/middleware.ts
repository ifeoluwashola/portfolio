import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

interface SessionData {
  role?: string;
  status?: string;
  is_first_login?: boolean;
  billing_status?: string;
}

// Next.js fetch extension type
interface NextRequestInit extends RequestInit {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

// Simple in-memory cache for session checks (Best effort in Edge Runtime)
const sessionCache = new Map<string, { data: SessionData, expiry: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

async function fetchBackendSession(token: string, type: 'admin' | 'student'): Promise<SessionData | null> {
  const cacheKey = `${type}:${token}`;
  const cached = sessionCache.get(cacheKey);
  
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const endpoint = type === 'admin' 
    ? `${API_BASE_URL}/v1/auth/session` 
    : `${API_BASE_URL}/v1/academy/session`;

  try {
    const options: NextRequestInit = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      // Short cache to avoid redundant hits on rapid navigation
      next: { revalidate: 30 } 
    };

    const res = await fetch(endpoint, options);

    if (!res.ok) return null;
    const data = await res.json() as SessionData;
    
    // Update local memory cache
    sessionCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });
    return data;
  } catch (err) {
    console.error(`Session fetch failed for ${type}:`, err);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ===== ADMIN ROUTING =====
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const token = request.cookies.get('auth_token');
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const session = await fetchBackendSession(token.value, 'admin');
    if (!session) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }

    // Role check (Admin portal requires admin role)
    if (session.role !== 'admin' && session.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Force password change on first login
    if (session.is_first_login === true && pathname !== '/admin/change-password') {
      return NextResponse.redirect(new URL('/admin/change-password', request.url));
    }
  }

  // ===== STUDENT PORTAL ROUTING =====
  // Redirect old /academy/billing → new /academy/dashboard/billing
  if (pathname === '/academy/billing') {
    return NextResponse.redirect(new URL('/academy/dashboard/billing', request.url));
  }

  if (pathname.startsWith('/academy/dashboard')) {
    const studentToken = request.cookies.get('academy_token');
    if (!studentToken) {
      return NextResponse.redirect(new URL('/academy/login', request.url));
    }

    const session = await fetchBackendSession(studentToken.value, 'student');
    if (!session) {
      const response = NextResponse.redirect(new URL('/academy/login', request.url));
      response.cookies.delete('academy_token');
      return response;
    }

    if (session.status === 'disqualified') {
      return NextResponse.redirect(new URL('/academy/access-revoked', request.url));
    }

    // If payment is overdue and they are not already on the billing page, lock them there
    if (
      session.billing_status === 'payment_locked' &&
      !pathname.startsWith('/academy/dashboard/billing')
    ) {
      return NextResponse.redirect(new URL('/academy/dashboard/billing', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/academy/dashboard/:path*', '/academy/billing'],
};

