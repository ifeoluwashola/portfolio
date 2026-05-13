"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { API_BASE_URL } from "@/lib/api-config";
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

    // Extract token from Go API's Set-Cookie header
    const setCookieHeader = res.headers.get("Set-Cookie");
    let token = "";
    if (setCookieHeader) {
      const match = setCookieHeader.match(/academy_token=([^;]+)/);
      if (match) token = match[1];
    }

    const data = await res.json();
    const { is_first_login } = data;

    if (!token) {
       return { error: "Security protocol failure: Session negotiation failed." };
    }

    // Set HttpOnly cookie
    (await cookies()).set("academy_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
  redirect("/academy/login");
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
  const token = (await cookies()).get("academy_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/academy/dashboard`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return { error: "Failed to fetch dashboard data" };
    return await res.json();
  } catch {
    return { error: "Connection to API failed" };
  }
}

export async function getStudentStatus() {
  const token = (await cookies()).get("academy_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/academy/dashboard`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return { error: "Failed to fetch student status" };
    const data = await res.json();
    return { status: data.status };
  } catch {
    return { error: "Connection to API failed" };
  }
}

export async function submitAssignment(weekId: number, githubUrl: string, submissionFileKey?: string) {
  const token = (await cookies()).get("academy_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/academy/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ week_id: weekId, github_url: githubUrl, submission_file_key: submissionFileKey || null }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { error: errorText || "Submission failed" };
    }

    return { success: true };
  } catch {
    return { error: "Connection to API failed" };
  }
}

export async function getAcademySession() {
  const cookieStore = await cookies();
  return !!cookieStore.get("academy_token")?.value;
}

export async function submitLabFix(labId: string, proposedFix: string) {
  const token = (await cookies()).get("academy_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/labs/${labId}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ proposed_fix: proposedFix }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { error: errorText || "Submission failed" };
    }

    return { success: true };
  } catch {
    return { error: "Connection to API failed" };
  }
}

export async function addLabComment(submissionId: number, body: string) {
  const token = (await cookies()).get("academy_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/labs/submissions/${submissionId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ body }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { error: errorText || "Comment failed" };
    }

    return { success: true };
  } catch {
    return { error: "Connection to API failed" };
  }
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
  const url = token ? `${API_BASE_URL}/v1/admin/alumni` : `${API_BASE_URL}/v1/alumni`;
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
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/admin/students/${id}/warn`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) return { error: await res.text() };
    return { success: true };
  } catch {
    return { error: "Failed to warn student" };
  }
}

export async function disqualifyStudent(id: string, reason: string) {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/admin/students/${id}/disqualify`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) return { error: await res.text() };
    return { success: true };
  } catch {
    return { error: "Failed to disqualify student" };
  }
}

export async function submitCapstone(data: Record<string, unknown>) {
  const token = (await cookies()).get("academy_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/academy/capstone`, {
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
    return { error: "Failed to submit capstone" };
  }
}

export async function getPendingCapstones() {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/admin/alumni/pending`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return { error: "Failed to fetch pending capstones" };
    return await res.json();
  } catch {
    return { error: "Connection failed" };
  }
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
  const token = (await cookies()).get("academy_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/academy/billing`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return { error: "Failed to fetch billing status" };
    return await res.json() as StudentBilling;
  } catch {
    return { error: "Connection to API failed" };
  }
}

/**
 * Fetches the full billing hub aggregate (billing + payment_history + count).
 * This is the primary action used by the /academy/billing page.
 */
export async function getBillingHub(): Promise<BillingHub | { error: string }> {
  const token = (await cookies()).get("academy_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/academy/billing/hub`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return { error: "Failed to fetch billing hub" };
    return await res.json() as BillingHub;
  } catch {
    return { error: "Connection to API failed" };
  }
}


/**
 * Initiates an installment payment from the billing dashboard.
 * @param amountNaira - The amount in Naira (not kobo); the backend handles conversion.
 */
export async function initiateBillingPayment(
  amountNaira: number
): Promise<{ authorization_url: string; reference: string } | { error: string }> {
  const token = (await cookies()).get("academy_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/academy/billing/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ amount_naira: amountNaira }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { error: errorText || "Payment initialization failed" };
    }

    const data = await res.json();
    return {
      authorization_url: data.authorization_url,
      reference: data.reference,
    };
  } catch {
    return { error: "Connection to API failed" };
  }
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

  const academyCookie = cookieStore.get("academy_token")?.value;
  if (!academyCookie) {
    return { granted: false, reason: "unauthenticated" };
  }

  // Check student status
  try {
    const res = await fetch(`${API_BASE_URL}/v1/academy/billing`, {
      headers: { "Authorization": `Bearer ${academyCookie}` },
      cache: "no-store",
    });
    if (!res.ok) return { granted: false, reason: "unauthorized" };
    
    const billing = await res.json() as StudentBilling;
    if (billing.billing_status === "payment_locked") {
      return { granted: false, reason: "locked" };
    }
    return { granted: true };
  } catch {
    return { granted: false, reason: "error" };
  }
}

export async function getS3UploadUrl(filename: string) {
  const token = (await cookies()).get("academy_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/media/upload-url?filename=${encodeURIComponent(filename)}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { error: `Failed to generate upload URL: ${errorText}` };
    }
    return await res.json() as { upload_url: string; file_key: string };
  } catch {
    return { error: "Connection to API failed" };
  }
}
