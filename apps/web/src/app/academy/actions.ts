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
  } catch (err) {
    console.error("Login action error:", err);
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
  } catch (err) {
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
  } catch (err) {
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
  } catch (err) {
    return { error: "Failed to reset password" };
  }
}
