"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

// ===== AUTH ACTIONS =====

export async function adminLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/v1/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.error || "Invalid credentials" };
    }

    const data = await res.json();
    const { is_first_login, role, token: bodyToken, refresh_token: bodyRefreshToken } = data;

    const finalToken = bodyToken;
    const finalRefreshToken = bodyRefreshToken;

    if (!finalToken || !finalRefreshToken) {
      return { error: "Security protocol failure: Session negotiation failed." };
    }

    const cookieStore = await cookies();
    
    // Set Access Token (15 minutes)
    cookieStore.set("auth_token", finalToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60,
      path: "/",
      sameSite: "lax",
    });

    // Set Refresh Token (24 hours)
    cookieStore.set("auth_refresh_token", finalRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
      sameSite: "lax",
    });

    return { success: true, is_first_login, role };
  } catch {
    return { error: "Connection to authentication server failed" };
  }
}

export async function adminLogout() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  // Revoke the token on the server
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/v1/admin/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
    } catch {
      // Best-effort revocation
    }
  }

  cookieStore.delete("auth_token");
  cookieStore.delete("auth_refresh_token");
  cookieStore.delete("admin_last_active");
  redirect("/admin/login");
}

export async function refreshAdminSession() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("auth_refresh_token")?.value;
  
  if (!refreshToken) return { success: false };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/admin/refresh`, {
      method: "POST",
      headers: {
        "Cookie": `auth_refresh_token=${refreshToken}`
      },
      cache: "no-store"
    });

    if (!res.ok) {
      cookieStore.delete("auth_token");
      cookieStore.delete("auth_refresh_token");
      return { success: false };
    }

    const data = await res.json();
    if (!data.success || !data.token || !data.refresh_token) {
      return { success: false };
    }

    cookieStore.set("auth_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60,
      path: "/",
      sameSite: "lax",
    });

    cookieStore.set("auth_refresh_token", data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
      sameSite: "lax",
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function adminChangePassword(formData: FormData) {
  const newPassword = formData.get("new_password") as string;
  const token = (await cookies()).get("auth_token")?.value;

  if (!token) return { error: "Unauthorized" };
  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/v1/admin/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ new_password: newPassword }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.error || "Failed to change password" };
    }

    // Token was revoked by the server — clear cookies
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    cookieStore.delete("auth_refresh_token");
    return { success: true };
  } catch {
    return { error: "Failed to change password" };
  }
}

export async function adminInvite(formData: FormData) {
  const email = formData.get("email") as string;
  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const token = (await cookies()).get("auth_token")?.value;

  if (!token) return { error: "Unauthorized" };
  if (!email || !firstName || !lastName) {
    return { error: "All fields are required" };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/v1/admin/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ email, first_name: firstName, last_name: lastName }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.error || "Failed to send invite" };
    }

    return { success: true };
  } catch {
    return { error: "Failed to send invite" };
  }
}

// ===== API PROXY HELPER =====
// Used by admin pages to make authenticated API calls via server actions
// instead of reading the cookie from client-side JS

export async function adminFetch(path: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  let token = cookieStore.get("auth_token")?.value;
  
  if (!token) {
    const refreshed = await refreshAdminSession();
    if (refreshed.success) {
      token = cookieStore.get("auth_token")?.value;
    }
  }

  if (!token) {
    return { error: "Unauthorized", status: 401 };
  }

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...(options.headers || {}),
      },
      cache: "no-store",
    });

    // Handle 401 by attempting one-time refresh and retry
    if (res.status === 401) {
      const refreshed = await refreshAdminSession();
      if (refreshed.success) {
        const newToken = cookieStore.get("auth_token")?.value;
        const retryRes = await fetch(`${API_BASE_URL}${path}`, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${newToken}`,
            ...(options.headers || {}),
          },
          cache: "no-store",
        });
        
        if (!retryRes.ok) {
          const text = await retryRes.text();
          return { error: text, status: retryRes.status };
        }

        const contentType = retryRes.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const data = await retryRes.json();
          return { data, status: retryRes.status };
        }
        return { data: null, status: retryRes.status };
      }
      return { error: "Unauthorized", status: 401 };
    }

    if (!res.ok) {
      const text = await res.text();
      return { error: text, status: res.status };
    }

    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await res.json();
      return { data, status: res.status };
    }

    return { data: null, status: res.status };
  } catch {
    return { error: "API request failed", status: 500 };
  }
}

// ===== ACADEMY ADMIN ACTIONS =====

export async function getBillingOverview() {
  const result = await adminFetch("/v1/admin/billing/overview");
  if (result.error) return { error: result.error };
  return { data: result.data };
}

export async function getBillingLedger() {
  const result = await adminFetch("/v1/admin/billing/ledger");
  if (result.error) return { error: result.error };
  return { data: result.data };
}

export async function logManualPayment(studentID: string, amount: number, note: string) {
  const result = await adminFetch("/v1/admin/billing/manual-payment", {
    method: "POST",
    body: JSON.stringify({ student_id: studentID, amount, note }),
  });
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function updateStudentStatus(studentID: string, academicStatus: string, isManuallyLocked: boolean) {
  const result = await adminFetch(`/v1/admin/students/${studentID}/status`, {
    method: "PUT",
    body: JSON.stringify({ academic_status: academicStatus, is_manually_locked: isManuallyLocked }),
  });
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function getCohortApplications() {
  const result = await adminFetch("/v1/admin/cohort-applications");
  if (result.error) return { error: result.error, status: result.status };
  return { data: result.data, status: result.status };
}

export async function grantScholarship(id: string, amountNaira: number) {
  const result = await adminFetch(`/v1/admin/applications/${id}/grant-scholarship`, {
    method: "POST",
    body: JSON.stringify({ amount_naira: amountNaira }),
  });
  if (result.error) return { error: result.error, status: result.status };
  return { success: true };
}
