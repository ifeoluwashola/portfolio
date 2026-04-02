"use client";

import { useState } from "react";
import { Mail, ArrowLeft, Terminal, Send } from "lucide-react";
import Link from "next/link";
import { forgotPassword } from "../actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const result = await forgotPassword(email);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setSuccessMsg("If your account exists, you will receive a reset link shortly.");
      }
    } catch {
      setErrorMsg("Failed to process request. Try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 sm:px-6 font-mono">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/20" />

        <div className="flex flex-col items-center mb-10 mt-2 text-center">
          <div className="w-12 h-12 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center mb-6 text-yellow-500">
            <Terminal className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 uppercase tracking-tight">Recovery Terminal</h1>
          <p className="text-slate-500 text-sm mt-3">Initiating password_reset.sh protocol...</p>
        </div>

        {successMsg ? (
          <div className="space-y-6 text-center">
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-6">
              <p className="text-yellow-500 text-sm leading-relaxed">{successMsg}</p>
            </div>
            <Link href="/academy/login" className="inline-flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors text-sm font-bold uppercase">
              <ArrowLeft className="w-4 h-4" />
              Return_to_Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4">
                <span className="text-red-400 text-sm">ERR: {errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 flex items-center gap-2 uppercase">
                <Mail className="w-3.5 h-3.5" />
                EMAIL_ADDRESS
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@domain.com"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-yellow-500/50 transition-all text-sm"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isLoading ? "PROSESSING..." : <><Send className="w-4 h-4" /> SEND_RECOVERY_TOKEN</>}
            </button>

            <div className="text-center">
              <Link href="/academy/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-yellow-500 transition-colors text-xs uppercase font-bold">
                <ArrowLeft className="w-3 h-3" />
                Exit_Terminal
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
