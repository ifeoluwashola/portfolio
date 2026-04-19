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
    const res = await fetch(`${API_BASE_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.error || "Invalid credentials" };
    }

    // Extract token from Go API's Set-Cookie header
    const setCookieHeader = res.headers.get("Set-Cookie");
    let token = "";
    if (setCookieHeader) {
      const match = setCookieHeader.match(/auth_token=([^;]+)/);
      if (match) token = match[1];
    }

    const data = await res.json();
    const { is_first_login, role } = data;

    if (!token) {
      return { error: "Security protocol failure: Session negotiation failed." };
    }

    // Set HttpOnly cookie — NOT accessible to client JS
    (await cookies()).set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours (matches JWT expiry)
      path: "/",
      sameSite: "strict",
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
      await fetch(`${API_BASE_URL}/admin/logout`, {
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
  redirect("/admin/login");
}

export async function adminChangePassword(formData: FormData) {
  const newPassword = formData.get("new_password") as string;
  const token = (await cookies()).get("auth_token")?.value;

  if (!token) return { error: "Unauthorized" };
  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/admin/change-password`, {
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

    // Token was revoked by the server — clear cookie
    (await cookies()).delete("auth_token");
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
    const res = await fetch(`${API_BASE_URL}/admin/invite`, {
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
  const token = (await cookies()).get("auth_token")?.value;
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
