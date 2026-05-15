import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

/**
 * Catch-all API proxy for student academy routes.
 * Reads the HttpOnly academy_token cookie server-side and forwards it to the Go API.
 * 
 * Usage from client components:
 *   fetch('/api/academy/proxy/v1/academy/...')
 *   → proxies to: ${API_BASE_URL}/v1/academy/...
 */

async function proxyRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("academy_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  const targetPath = path.join("/");
  const targetUrl = `${API_BASE_URL}/${targetPath}`;

  // Forward query params
  const url = new URL(req.url);
  const queryString = url.search;

  try {
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
    };

    // Forward content-type for POST/PUT
    const contentType = req.headers.get("content-type");
    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
      cache: "no-store",
      redirect: "manual", // Don't follow redirects, forward them to the browser
    };

    // Forward body for POST/PUT/PATCH
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      fetchOptions.body = await req.text();
    }

    let res = await fetch(`${targetUrl}${queryString}`, fetchOptions);
    let newTokensData: any = null;

    if (res.status === 401) {
      const refreshToken = cookieStore.get("academy_refresh_token")?.value;
      if (refreshToken) {
        const refreshRes = await fetch(`${API_BASE_URL}/v1/academy/refresh`, {
          method: "POST",
          headers: { "Cookie": `academy_refresh_token=${refreshToken}` },
          cache: "no-store",
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (data.success && data.token) {
            newTokensData = data;
            headers["Authorization"] = `Bearer ${data.token}`;
            res = await fetch(`${targetUrl}${queryString}`, fetchOptions);
          }
        }
      }
    }

    if (res.status === 302 || res.status === 301) {
      const location = res.headers.get("Location");
      if (location) return NextResponse.redirect(new URL(location, req.url));
    }

    const responseBody = await res.text();
    const response = new NextResponse(responseBody, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });

    if (newTokensData) {
      response.cookies.set("academy_token", newTokensData.token, {
        httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 15 * 60, path: "/", sameSite: "lax",
      });
      response.cookies.set("academy_refresh_token", newTokensData.refresh_token, {
        httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60, path: "/", sameSite: "lax",
      });
    }

    return response;
  } catch (err) {
    console.error("Student Proxy failed:", err);
    return NextResponse.json({ error: "Proxy request failed" }, { status: 502 });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
