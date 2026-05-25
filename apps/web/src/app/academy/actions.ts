"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { API_BASE_URL } from "@/lib/api-config";
import { adminFetch } from "../admin/actions";
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

interface AlumniProject {
  project_title: string;
  description: string;
  architecture_diagram_url: string;
  live_demo_url: string;
  repo_url: string;
}

interface AlumniData {
  student_id: string;
  cohort_name: string;
  linkedin_url: string;
  github_url: string;
  projects: AlumniProject[];
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const targetUrl = `${API_BASE_URL}/v1/academy/login`;
    console.log(`[Server Action] Login attempting fetch to: ${targetUrl}`);
    
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    console.log(`[Server Action] Login response status: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text();
      return { error: errorText || "Invalid credentials" };
    }

    const data = await res.json();
    const { is_first_login, token: bodyToken, refresh_token: bodyRefreshToken } = data;

    const finalToken = bodyToken;
    const finalRefreshToken = bodyRefreshToken;

    if (!finalToken || !finalRefreshToken) {
       return { error: "Security protocol failure: Session negotiation failed." };
    }

    const cookieStore = await cookies();
    
    // Set Access Token (15 minutes)
    cookieStore.set("academy_token", finalToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60,
      path: "/",
      sameSite: "lax",
    });

    // Set Refresh Token (7 days)
    cookieStore.set("academy_refresh_token", finalRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    });

    return { success: true, is_first_login };
  } catch {
    console.error("Login action error");
    return { error: "Connection to authentication server failed" };
  }
}

export async function logout() {
  const token = (await cookies()).get("academy_token")?.value;

  if (token) {
    try {
      await fetch(`${API_BASE_URL}/v1/academy/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
    } catch {
      // Best-effort
    }
  }

  (await cookies()).delete("academy_token");
  (await cookies()).delete("academy_refresh_token");
  redirect("/academy/login");
}

export async function refreshStudentSession() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("academy_refresh_token")?.value;
  
  if (!refreshToken) return { success: false };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/academy/refresh`, {
      method: "POST",
      headers: {
        "Cookie": `academy_refresh_token=${refreshToken}`
      },
      cache: "no-store"
    });

    if (!res.ok) {
      cookieStore.delete("academy_token");
      cookieStore.delete("academy_refresh_token");
      return { success: false };
    }

    const data = await res.json();
    if (!data.success || !data.token || !data.refresh_token) {
      return { success: false };
    }

    cookieStore.set("academy_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60,
      path: "/",
      sameSite: "lax",
    });

    cookieStore.set("academy_refresh_token", data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function academyFetch(path: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  let token = cookieStore.get("academy_token")?.value;
  
  if (!token) {
    const refreshed = await refreshStudentSession();
    if (refreshed.success) {
      token = cookieStore.get("academy_token")?.value;
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

    if (res.status === 401) {
      const refreshed = await refreshStudentSession();
      if (refreshed.success) {
        const newToken = cookieStore.get("academy_token")?.value;
        const retryRes = await fetch(`${API_BASE_URL}${path}`, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${newToken}`,
            ...(options.headers || {}),
          },
          cache: "no-store",
        });
        
        if (!retryRes.ok) return { error: await retryRes.text(), status: retryRes.status };
        const contentType = retryRes.headers.get("content-type");
        if (contentType?.includes("application/json")) {
           return { data: await retryRes.json(), status: retryRes.status };
        }
        return { data: null, status: retryRes.status };
      }
      return { error: "Unauthorized", status: 401 };
    }

    if (!res.ok) return { error: await res.text(), status: res.status };
    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
       return { data: await res.json(), status: res.status };
    }
    return { data: null, status: res.status };
  } catch {
    return { error: "API request failed", status: 500 };
  }
}

export async function changePassword(formData: FormData) {
  const newPassword = formData.get("new_password") as string;
  const token = (await cookies()).get("academy_token")?.value;

  if (!token) return { error: "Unauthorized" };
  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters long" };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/v1/academy/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ new_password: newPassword }),
    });

    if (!res.ok) {
      return { error: await res.text() };
    }

    (await cookies()).delete("academy_token");
    (await cookies()).delete("academy_refresh_token");
    return { success: true };
  } catch {
    return { error: "Failed to update password" };
  }
}

export async function forgotPassword(email: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/v1/academy/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) return { error: await res.text() };
    return { success: true };
  } catch {
    return { error: "Failed to process forgot password request" };
  }
}

export async function resetPassword(formData: FormData) {
  const token = formData.get("token") as string;
  const newPassword = formData.get("new_password") as string;

  try {
    const res = await fetch(`${API_BASE_URL}/v1/academy/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password: newPassword }),
    });

    if (!res.ok) return { error: await res.text() };
    return { success: true };
  } catch {
    return { error: "Failed to reset password" };
  }
}

export async function getDashboardData() {
  const result = await academyFetch("/v1/academy/dashboard");
  if (result.error) return { error: result.error };
  return result.data;
}

export async function getStudentStatus() {
  const result = await academyFetch("/v1/academy/dashboard");
  if (result.error) return { error: result.error };
  return { status: result.data.status, cohort_status: result.data.cohort_status };
}

export async function submitAssignment(weekId: number, githubUrl: string, submissionFileKey?: string) {
  const result = await academyFetch("/v1/academy/assignments", {
    method: "POST",
    body: JSON.stringify({ week_id: weekId, github_url: githubUrl, submission_file_key: submissionFileKey || null }),
  });
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function getAcademySession() {
  const cookieStore = await cookies();
  return !!cookieStore.get("academy_token")?.value;
}

export async function submitLabFix(labId: string, proposedFix: string) {
  const result = await academyFetch(`/v1/labs/${labId}/submit`, {
    method: "POST",
    body: JSON.stringify({ proposed_fix: proposedFix }),
  });
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function addLabComment(submissionId: number, body: string) {
  const result = await academyFetch(`/v1/labs/submissions/${submissionId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function getEligibleStudents() {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/admin/alumni/eligible`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return { error: "Failed to fetch eligible students" };
    return await res.json();
  } catch {
    return { error: "Connection failed" };
  }
}

export async function approveCapstone(capstoneId: number, data: { cohort_name: string; linkedin_url: string; github_url: string }) {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/admin/alumni/approve/${capstoneId}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) return { error: await res.text() };
    return { success: true };
  } catch {
    return { error: "Approval process failed" };
  }
}

export async function updateAlumni(id: number, data: AlumniData) {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/admin/alumni/${id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) return { error: await res.text() };
    return { success: true };
  } catch {
    return { error: "Failed to update alumni profile" };
  }
}

export async function getAlumniList() {
  const token = (await cookies()).get("auth_token")?.value;
  const url = `${API_BASE_URL}/v1/alumni`;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store"
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getAlumniProfile(slug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/v1/alumni/${slug}`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
export async function getAllStudents() {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/admin/students`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return { error: "Failed to fetch students" };
    return await res.json();
  } catch {
    return { error: "Connection failed" };
  }
}

export async function warnStudent(id: string, reason: string) {
  const result = await adminFetch(`/v1/admin/students/${id}/warn`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function disqualifyStudent(id: string, reason: string) {
  const result = await adminFetch(`/v1/admin/students/${id}/disqualify`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function getStudentCapstone() {
  const result = await academyFetch("/v1/academy/capstone", {
    method: "GET",
  });
  if (result.error) return { error: result.error };
  return result;
}

export async function submitCapstone(data: Record<string, unknown>) {
  const result = await academyFetch("/v1/academy/capstone", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function getPendingCapstones() {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/admin/graduations/pending`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return { error: "Failed to fetch pending capstones" };
    return await res.json();
  } catch {
    return { error: "Connection failed" };
  }
}

export async function getCapstoneById(id: number) {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/admin/graduations/pending/${id}`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return { error: "Failed to fetch capstone" };
    return await res.json();
  } catch {
    return { error: "Connection failed" };
  }
}

export async function rejectCapstone(id: number, feedback: string) {
  const result = await adminFetch(`/v1/admin/graduations/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ feedback }),
  });
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function revokeAlumni(slug: string) {
  const result = await adminFetch(`/v1/admin/alumni/${slug}`, {
    method: "DELETE",
  });
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function createManualAlumni(data: any) {
  const result = await adminFetch(`/v1/admin/alumni/manual`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (result.error) return { error: result.error };
  return { success: true };
}

// ─── Billing & Installments ────────────────────────────────────────────────────

export interface StudentBilling {
  student_id: string;
  total_due: number;       // in kobo
  total_paid: number;      // in kobo
  next_payment_due_date: string | null;
  billing_status: "good_standing" | "payment_locked" | "paid_in_full";
}

export interface PaymentHistoryItem {
  id: number;
  student_id: string;
  amount_paid: number;    // in kobo
  gateway: string;
  reference_id: string;
  created_at: string;
}

export interface BillingHub {
  billing: StudentBilling;
  payment_history: PaymentHistoryItem[];
  payment_count: number;
}

/**
 * Fetches the current billing ledger for the logged-in student.
 * Returns kobo amounts; the UI divides by 100 for display.
 */
export async function getBillingStatus(): Promise<StudentBilling | { error: string }> {
  const result = await academyFetch("/v1/academy/billing");
  if (result.error) return { error: result.error };
  return result.data as StudentBilling;
}

/**
 * Fetches the full billing hub aggregate (billing + payment_history + count).
 * This is the primary action used by the /academy/billing page.
 */
export async function getBillingHub(): Promise<BillingHub | { error: string }> {
  const result = await academyFetch("/v1/academy/billing/hub");
  if (result.error) return { error: result.error };
  return result.data as BillingHub;
}


/**
 * Initiates an installment payment from the billing dashboard.
 * @param amountNaira - The amount in Naira (not kobo); the backend handles conversion.
 */
export async function initiateBillingPayment(
  amountNaira: number
): Promise<{ authorization_url: string; reference: string } | { error: string }> {
  const result = await academyFetch("/v1/academy/billing/pay", {
    method: "POST",
    body: JSON.stringify({ amount_naira: amountNaira }),
  });
  if (result.error) return { error: result.error };
  return {
    authorization_url: result.data.authorization_url,
    reference: result.data.reference,
  };
}

/**
 * Initializes a new registration checkout.
 * paymentPlan: "full" (₦250,000) | "installment" (₦100,000 deposit)
 */
export async function initializeApplication(formData: FormData, paymentPlan: "full" | "installment" = "full") {
  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const currentRole = formData.get("current_role") as string;
  const goal = formData.get("goal") as string;
  const experienceLevel = formData.get("experience_level") as string;
  const hasLaptop = formData.get("has_laptop") === "on";

  if (!firstName || !lastName || !email) {
    return { error: "First name, last name, and email are required" };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/v1/academy/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        current_role: currentRole,
        goal,
        experience_level: experienceLevel,
        has_laptop: hasLaptop,
        payment_plan: paymentPlan,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { error: errorText || "Application initialization failed" };
    }

    const data = await res.json();
    return { authorization_url: data.authorization_url, reference: data.reference };
  } catch {
    return { error: "Connection to API failed" };
  }
}

export async function checkMaterialAccess() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("auth_token")?.value;
  if (authCookie) {
    // Admin, grant access
    return { granted: true };
  }

  const result = await academyFetch("/v1/academy/billing");
  if (result.error) return { granted: false, reason: result.status === 401 ? "unauthenticated" : "error" };

  const billing = result.data as StudentBilling;
  if (billing.billing_status === "payment_locked") {
    return { granted: false, reason: "locked" };
  }
  return { granted: true };
}

export async function getS3UploadUrl(filename: string, type?: string) {
  let url = `/v1/media/upload-url?filename=${encodeURIComponent(filename)}`;
  if (type) url += `&type=${encodeURIComponent(type)}`;
  const result = await academyFetch(url);
  if (result.error) return { error: result.error };
  return result.data as { upload_url: string; file_key: string };
}

export async function getStudentProfile() {
  const result = await academyFetch("/v1/profile");
  if (result.error) return { error: result.error };
  return result.data as {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_s3_key?: string;
    linkedin_url?: string;
    github_url?: string;
    bio?: string;
  };
}

export async function updateStudentProfile(data: {
  avatar_s3_key?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  bio?: string | null;
}) {
  const result = await academyFetch("/v1/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (result.error) return { error: result.error };
  return { success: true };
}
