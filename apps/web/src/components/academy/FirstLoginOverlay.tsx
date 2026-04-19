"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { changePassword } from "@/app/academy/actions";

export function FirstLoginOverlay() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    
    const result = await changePassword(formData);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Success - changePassword deletes the cookie, so we need to re-login
      // The middleware or dashboard will redirect once the page refreshes
      window.location.reload();
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 dark:bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-yellow-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(234,179,8,0.1)]">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 border border-yellow-500/20">
            <Lock className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-yellow-500 tracking-tight">Security Alert</h2>
          <p className="text-muted-foreground text-sm mt-2">Temporary password detected. You must update your credentials before proceeding to the terminal.</p>
        </div>

        <form action={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-xs font-mono">
              ERR: {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-widest">Set New Password</label>
            <input
              type="password"
              name="new_password"
              required
              placeholder="••••••••••••"
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-yellow-500 focus:outline-none focus:border-yellow-500/50 transition-all font-mono"
            />
            <p className="text-[10px] text-muted-foreground/50 italic mt-1">Min. 8 characters requirement.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)] font-mono disabled:opacity-50"
          >
            {loading ? "PROCESSING..." : "UPDATE_CREDENTIALS && RE_LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
}
