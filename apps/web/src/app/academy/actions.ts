"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/v1/academy/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { error: errorText || "Invalid credentials" };
    }

    const data = await res.json();
    const { token, is_first_login } = data;

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

    // After password change, we might want to log them out or refresh their token if the backend provides a new one.
    // For now, let's keep them logged in but force a re-login for security if needed.
    // Actually, the backend might have invalidated the token if we store is_first_login in it.
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
  } catch (err) {
    console.error("Dashboard data fetch error:", err);
    return { error: "Connection to API failed" };
  }
}

export async function submitAssignment(weekId: number, githubUrl: string) {
  const token = (await cookies()).get("academy_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/academy/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ week_id: weekId, github_url: githubUrl }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { error: errorText || "Submission failed" };
    }

    return { success: true };
  } catch (err) {
    console.error("Assignment submission error:", err);
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
  } catch (err) {
    console.error("Lab submission error:", err);
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
  } catch (err) {
    console.error("Comment submission error:", err);
    return { error: "Connection to API failed" };
  }
}

// Phase 6: Alumni Hall of Fame Actions

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
  } catch (err) {
    console.error("Eligible students fetch error:", err);
    return { error: "Connection failed" };
  }
}

export async function graduateStudent(data: any) {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/admin/alumni/graduate`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) return { error: await res.text() };
    return { success: true };
  } catch (err) {
    console.error("Graduation error:", err);
    return { error: "Graduation process failed" };
  }
}

export async function updateAlumni(id: number, data: any) {
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
  } catch (err) {
    console.error("Update alumni error:", err);
    return { error: "Failed to update alumni profile" };
  }
}

export async function getAlumniList() {
  const token = (await cookies()).get("auth_token")?.value;
  // Admin list might need auth, but public list doesn't. 
  // Let's check if we have a token (admin view) or not (public view)
  const url = token ? `${API_BASE_URL}/v1/admin/alumni` : `${API_BASE_URL}/v1/alumni`;
  const headers: any = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store"
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Alumni list fetch error:", err);
    return [];
  }
}

export async function getAlumniProfile(slug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/v1/alumni/${slug}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Alumni profile fetch error:", err);
    return null;
  }
}

