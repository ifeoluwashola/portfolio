"use client";

import React, { useState } from "react";
import { 
  Zap, 
  ChevronRight, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  Terminal,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { WaitlistUpsell } from "@/components/academy/WaitlistUpsell";

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";
    try {
      const res = await fetch(`${apiBase}/v1/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          name,
          email,
          whatsapp_number: whatsappNumber,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-muted-foreground font-sans selection:bg-yellow-500/30 selection:text-yellow-200">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/5 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Navigation */}
        <Link 
          href="/academy" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Overview
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Column: Context */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 text-[10px] font-black uppercase tracking-widest mb-6">
              <Zap className="w-3 h-3 fill-current animate-pulse" />
              🟢 Cohort 1 In Session
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black text-foreground leading-tight mb-8">
              Join the Waitlist <br />
              for <span className="text-yellow-600 dark:text-yellow-500">Cohort 2.</span>
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              Admission for Cohort 1 is currently locked as the program is underway. Secure your spot in the queue for Cohort 2 to receive priority notifications and early-bird enrollment access.
            </p>

            <div className="space-y-6">
              {[
                { 
                  icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />, 
                  title: "Priority Notification", 
                  desc: "Waitlisted leads receive early access to applications before the general public." 
                },
                { 
                  icon: <Terminal className="w-5 h-5 text-cyan-600 dark:text-cyan-500" />, 
                  title: "Early Bird Pricing", 
                  desc: "Gain eligibility for special discounts when Cohort 2 enrollment opens." 
                },
                { 
                  icon: <CheckCircle2 className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />, 
                  title: "Day-One Onboarding", 
                  desc: "Guaranteed support and fast-tracked provisioning for accepted waitlist students." 
                }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-foreground font-bold text-sm mb-1">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {success ? (
              <div className="py-6 space-y-6">
                <WaitlistUpsell email={email} />
                <Link
                  href="/academy"
                  className="inline-flex items-center justify-center w-full py-4 border border-border hover:bg-muted text-foreground font-bold uppercase tracking-widest text-xs rounded-2xl transition-all"
                >
                  Return to Academy Page
                </Link>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="mb-8 pb-8 border-b border-border">
                   <h2 className="text-xl font-bold text-foreground mb-2">Cohort 2 Waitlist</h2>
                   <p className="text-sm text-muted-foreground">Provide your contact details to secure your priority spot.</p>
                </div>

                {error && (
                  <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                    <input 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-background border border-border focus:border-yellow-500/50 outline-none rounded-xl px-4 py-3 text-foreground transition-colors"
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-background border border-border focus:border-yellow-500/50 outline-none rounded-xl px-4 py-3 text-foreground transition-colors"
                      placeholder="jane@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">WhatsApp Number</label>
                    <input 
                      type="tel"
                      required
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full bg-background border border-border focus:border-yellow-500/50 outline-none rounded-xl px-4 py-3 text-foreground transition-colors"
                      placeholder="+234..."
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className={`group w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black uppercase tracking-widest transition-all duration-200 ${
                      loading 
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-yellow-500 text-slate-950 hover:bg-yellow-400 shadow-[0_4px_20px_rgba(234,179,8,0.15)] hover:shadow-[0_0_40px_rgba(234,179,8,0.3)] hover:scale-[1.01] active:scale-[0.99]"
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Securing Spot...
                      </>
                    ) : (
                      <>
                        Join Cohort 2 Waitlist
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
