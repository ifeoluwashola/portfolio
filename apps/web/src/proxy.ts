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

async function hashTokenEdge(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function fetchBackendSession(token: string, type: 'admin' | 'student'): Promise<SessionData | null> {
  const hashedToken = await hashTokenEdge(token);
  const cacheKey = `${type}:${hashedToken}`;
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

async function refreshSession(type: 'admin' | 'student', refreshToken: string): Promise<{ token: string, refreshToken: string } | null> {
  const endpoint = type === 'admin' 
    ? `${API_BASE_URL}/v1/admin/refresh` 
    : `${API_BASE_URL}/v1/academy/refresh`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Cookie': `${type === 'admin' ? 'auth_refresh_token' : 'academy_refresh_token'}=${refreshToken}`
      }
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success || !data.token || !data.refresh_token) return null;
    
    return { token: data.token, refreshToken: data.refresh_token };
  } catch (err) {
    console.error(`Refresh failed for ${type}:`, err);
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ===== ADMIN ROUTING =====
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    let token = request.cookies.get('auth_token')?.value;
    const refreshToken = request.cookies.get('auth_refresh_token')?.value;
    let newTokens: { token: string, refreshToken: string } | null = null;

    if (!token && refreshToken) {
      newTokens = await refreshSession('admin', refreshToken);
      if (newTokens) {
        token = newTokens.token;
      } else {
        const response = NextResponse.redirect(new URL('/admin/login', request.url));
        response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
        response.cookies.set('auth_refresh_token', '', { maxAge: 0, path: '/' });
        response.cookies.set('admin_last_active', '', { maxAge: 0, path: '/admin' });
        return response;
      }
    }

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const lastActive = request.cookies.get('admin_last_active')?.value;
    const now = Date.now();
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    if (lastActive && (now - parseInt(lastActive, 10)) > INACTIVITY_TIMEOUT) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
      response.cookies.set('auth_refresh_token', '', { maxAge: 0, path: '/' });
      response.cookies.set('admin_last_active', '', { maxAge: 0, path: '/admin' });
      return response;
    }

    const session = await fetchBackendSession(token, 'admin');
    if (!session) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
      response.cookies.set('auth_refresh_token', '', { maxAge: 0, path: '/' });
      response.cookies.set('admin_last_active', '', { maxAge: 0, path: '/admin' });
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

    const response = NextResponse.next();
    
    // Update cookies if refreshed
    if (newTokens) {
      response.cookies.set('auth_token', newTokens.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60,
      });
      response.cookies.set('auth_refresh_token', newTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60,
      });
    }

    response.cookies.set('admin_last_active', now.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/admin',
    });
    return response;
  }

  // ===== STUDENT PORTAL ROUTING =====
  // Redirect old /academy/billing → new /academy/dashboard/billing
  if (pathname === '/academy/billing') {
    return NextResponse.redirect(new URL('/academy/dashboard/billing', request.url));
  }

  if (pathname.startsWith('/academy/dashboard')) {
    let studentToken = request.cookies.get('academy_token')?.value;
    const studentRefreshToken = request.cookies.get('academy_refresh_token')?.value;
    let newTokens: { token: string, refreshToken: string } | null = null;

    if (!studentToken && studentRefreshToken) {
      newTokens = await refreshSession('student', studentRefreshToken);
      if (newTokens) {
        studentToken = newTokens.token;
      } else {
        const response = NextResponse.redirect(new URL('/academy/login', request.url));
        response.cookies.set('academy_token', '', { maxAge: 0, path: '/' });
        response.cookies.set('academy_refresh_token', '', { maxAge: 0, path: '/' });
        return response;
      }
    }

    if (!studentToken) {
      return NextResponse.redirect(new URL('/academy/login', request.url));
    }

    const session = await fetchBackendSession(studentToken, 'student');
    if (!session) {
      const response = NextResponse.redirect(new URL('/academy/login', request.url));
      response.cookies.set('academy_token', '', { maxAge: 0, path: '/' });
      response.cookies.set('academy_refresh_token', '', { maxAge: 0, path: '/' });
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
      const response = NextResponse.redirect(new URL('/academy/dashboard/billing', request.url));
      if (newTokens) {
        response.cookies.set('academy_token', newTokens.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 15 * 60,
        });
        response.cookies.set('academy_refresh_token', newTokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60,
        });
      }
      return response;
    }

    if (newTokens) {
      const response = NextResponse.next();
      response.cookies.set('academy_token', newTokens.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60,
      });
      response.cookies.set('academy_refresh_token', newTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/academy/dashboard/:path*', '/academy/billing'],
};

