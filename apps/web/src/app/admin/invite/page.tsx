"use client";

import { useState } from "react";

import { UserPlus, Mail, User, Shield, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { adminInvite } from "../actions";

export default function InviteAdminPage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("first_name", firstName);
      formData.set("last_name", lastName);

      const result = await adminInvite(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      setSuccess(true);
      setEmail("");
      setFirstName("");
      setLastName("");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Access Granted.</h1>
            <p className="text-slate-400">
              An invitation has been sent to <span className="text-emerald-400 font-mono">{email || "the administrator"}</span>.
              They will receive their temporary credentials via email.
            </p>
          </div>
          <div className="pt-4">
            <button 
              onClick={() => setSuccess(false)}
              className="px-6 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:border-emerald-500/50 transition-all flex items-center gap-2 mx-auto"
            >
              Invite Another Administrator
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-10 space-y-2">
        <div className="flex items-center gap-3 text-primary mb-2">
          <Shield className="w-5 h-5" />
          <span className="text-xs font-bold tracking-[0.2em] uppercase">Security Protocol</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
          Provision <span className="text-primary italic">New Admin.</span>
        </h1>
        <p className="text-slate-400 leading-relaxed text-lg">
          Add a trusted administrator to the Kybern Cloud infrastructure. They will be issued a temporary 
          passcode and forced to rotate it upon their initial sequence.
        </p>
      </div>

      <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-8 sm:p-10 relative overflow-hidden">
        {/* Abstract background element */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <UserPlus className="w-64 h-64 -mr-16 -mt-16" />
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {error}
          </div>
        )}

        <form onSubmit={handleInvite} className="space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3" /> Given Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="FIRST_NAME"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3" /> Surname
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="LAST_NAME"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Mail className="w-3 h-3" /> Infrastructure Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@kyberncloud.com"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-mono"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-10 py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group uppercase tracking-widest text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Issue Access Key
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 p-6 border border-slate-800 rounded-3xl bg-slate-900/30 flex items-start gap-4">
        <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center flex-shrink-0 text-yellow-500">
          <Shield className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-tight">Security Notice</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Provisioning a new administrator grants peak privileges. System logs will record this action 
            under your authority. Revoking access can be performed via the User Management terminal.
          </p>
        </div>
      </div>
    </div>
  );
}
