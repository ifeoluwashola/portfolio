"use client";

import { useState, Suspense } from "react";
import { Lock, ArrowLeft, Terminal, Key } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "../actions";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!token) {
      setErrorMsg("Missing_Reset_Token. Protocol rejected.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords_mismatch. Check parity.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("Password_too_short. Min 8 characters required.");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("token", token);
    formData.append("new_password", newPassword);

    try {
      const result = await resetPassword(formData);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setSuccessMsg("Password_reset_successful. Re-initiate login.");
      }
    } catch (err) {
      setErrorMsg("Failed to reset password. Connection interrupted.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center p-8 bg-red-500/10 border border-red-500/20 rounded-xl max-w-md w-full">
        <h2 className="text-red-400 font-bold mb-4 uppercase tracking-tighter text-xl">Critical Error: Broken Link</h2>
        <p className="text-red-400/80 text-sm mb-6">Reset token is missing or corrupted. Contact academy support terminal.</p>
        <Link href="/academy/forgot-password" className="text-slate-300 hover:text-yellow-500 underline text-xs font-bold uppercase transition-colors">
          $ sudo systemctl restart password_reset
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/20" />

      <div className="flex flex-col items-center mb-10 mt-2 text-center">
        <div className="w-12 h-12 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center mb-6 text-yellow-500">
          <Key className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 uppercase tracking-tight">Set_New_Password</h1>
        <p className="text-slate-500 text-sm mt-3">{"{ status: 'authenticated_via_token' }"}</p>
      </div>

      {successMsg ? (
        <div className="space-y-6 text-center">
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-6">
            <p className="text-yellow-500 text-sm leading-relaxed">{successMsg}</p>
          </div>
          <Link href="/academy/login" className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-lg font-bold uppercase text-sm transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            LOGIN_TERMINAL
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 flex items-center">
              <span className="text-red-400 text-xs">ERR: {errorMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-2 uppercase tracking-wide">
              <Lock className="w-3.5 h-3.5" />
              NEW_PASSWORD
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-yellow-500/50 transition-all text-sm"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-2 uppercase tracking-wide">
              <Lock className="w-3.5 h-3.5" />
              CONFIRM_NEW_PASSWORD
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-yellow-500/50 transition-all text-sm"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isLoading ? "PROSESSING..." : "COMMIT_PASSWORD_CHANGES"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 sm:px-6 font-mono">
      <Suspense fallback={<div className="text-yellow-500">Initializing Recovery Protocol...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
