"use client";

import { useState } from "react";
import { Lock, Mail, Terminal } from "lucide-react";
import { login } from "../../actions";

export default function StudentLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    setIsLoading(true);

    try {
      const result = await login(formData);
      
      if (result.error) {
        setErrorMsg(result.error);
        return;
      }

      if (result.success) {
        // Successful login, redirect to dashboard
        window.location.href = "/academy/dashboard";
      }
    } catch (err: unknown) {
      if (err instanceof Error) setErrorMsg(err.message);
      else setErrorMsg("Authentication failed. Internal server error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 sm:px-6">
      
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl relative overflow-hidden group">
        
        {/* Subtle top accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500/20 via-yellow-400 to-yellow-500/20" />

        <div className="flex flex-col items-center mb-10 mt-2 text-center">
          <div className="w-12 h-12 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center mb-6 shadow-inner text-yellow-500">
            <Terminal className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 font-mono tracking-tight">Student Portal</h1>
          <p className="text-slate-400 font-mono text-sm mt-3">{"{ access_granted: false }"}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 flex items-center">
              <span className="text-red-400 font-mono text-sm">ERR: {errorMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-mono font-medium text-slate-400 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              EMAIL_ADDRESS
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@domain.com"
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all font-mono text-sm disabled:opacity-50"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-xs font-mono font-medium text-slate-400 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                PASSWORD
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all font-mono text-sm disabled:opacity-50"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-mono font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:shadow-[0_0_25px_rgba(234,179,8,0.3)] disabled:opacity-50 flex justify-center items-center"
          >
            {isLoading ? "Authenticating..." : "./authenticate.sh"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800/60 pt-6">
          <a href="/academy/forgot-password" className="font-mono text-xs text-slate-500 hover:text-yellow-500/80 transition-colors">
            $ sudo grep &quot;forgot_password&quot; .logs
          </a>
        </div>
      </div>
    </div>
  );
}
