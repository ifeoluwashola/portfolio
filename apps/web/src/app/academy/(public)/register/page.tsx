"use client";

import React, { useState } from "react";
import { 
  Zap, 
  ChevronRight, 
  CreditCard, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  Laptop, 
  MonitorCheck, 
  Terminal,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { initializeApplication } from "../../actions";

export default function RegisterPage() {
  const [paymentPlan, setPaymentPlan] = useState<"full" | "installment">("full");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await initializeApplication(formData, paymentPlan);

    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    if (res.authorization_url) {
      window.location.href = res.authorization_url;
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-yellow-500/30 selection:text-yellow-200">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/5 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Navigation */}
        <Link 
          href="/academy" 
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-yellow-500 transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Overview
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Column: Context */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest mb-6">
              <Zap className="w-3 h-3 fill-current" />
              Cohort 1 Admission
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-8">
              Begin Your <br />
              <span className="text-yellow-500">Cloud Command.</span>
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed mb-10">
              Admission to Kybern Academy is restricted to 20 seats. We prioritise candidates 
              demonstrating high commitment to the 16-week immersive schedule.
            </p>

            <div className="space-y-6">
              {[
                { 
                  icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />, 
                  title: "Secure Enrollment", 
                  desc: "Your application triggers an instant Paystack secure gateway session." 
                },
                { 
                  icon: <Terminal className="w-5 h-5 text-cyan-500" />, 
                  title: "Provisioning", 
                  desc: "Upon successful payment, your student credentials are provisioned in < 60s." 
                },
                { 
                  icon: <CheckCircle2 className="w-5 h-5 text-yellow-500" />, 
                  title: "The 16-Week Lock", 
                  desc: "Includes 12 weeks of live training + 4 weeks of high-stakes capstone." 
                }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                  <div className="mt-1">{item.icon}</div>
                  <div>
                    <h3 className="text-white font-bold text-sm mb-1">{item.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="mb-8 pb-8 border-bottom border-slate-800">
               <h2 className="text-xl font-bold text-white mb-2">Student Registration</h2>
               <p className="text-sm text-slate-500">Provide your technical background and select a plan.</p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info Group */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">First Name</label>
                  <input 
                    name="first_name" required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-yellow-500/50 outline-none rounded-xl px-4 py-3 text-slate-200 transition-colors"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Last Name</label>
                  <input 
                    name="last_name" required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-yellow-500/50 outline-none rounded-xl px-4 py-3 text-slate-200 transition-colors"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                <input 
                  type="email" name="email" required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-yellow-500/50 outline-none rounded-xl px-4 py-3 text-slate-200 transition-colors"
                  placeholder="john@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Experience Level</label>
                  <select 
                    name="experience_level"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-yellow-500/50 outline-none rounded-xl px-4 py-3 text-slate-200 transition-colors appearance-none"
                  >
                    <option value="Absolute Beginner">Absolute Beginner</option>
                    <option value="Basic IT Knowledge">Basic IT Knowledge</option>
                    <option value="Intermediate / Developer">Intermediate / Developer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Phone</label>
                  <input 
                    name="phone"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-yellow-500/50 outline-none rounded-xl px-4 py-3 text-slate-200 transition-colors"
                    placeholder="+234..."
                  />
                </div>
              </div>

              {/* Hardware / Readiness */}
              <div className="space-y-6 pt-4 border-t border-slate-800/50">
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <Laptop className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-300">I own a working laptop (8GB+ RAM)</span>
                  </div>
                  <input type="checkbox" name="has_laptop" required className="accent-yellow-500 w-5 h-5" />
                </div>
              </div>

              {/* Payment Plan selection */}
              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Select Investment Plan</label>
                
                <div 
                  onClick={() => setPaymentPlan("full")}
                  className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer group ${
                    paymentPlan === "full" 
                      ? "border-yellow-500 bg-yellow-500/5" 
                      : "border-slate-800 hover:border-slate-700 bg-slate-950/50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-bold mb-1">Full Tuition</p>
                      <p className="text-xs text-slate-500">Single payment for complete 16-week access.</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xl font-black text-white font-mono">₦250k</p>
                       <p className="text-[10px] text-yellow-500 font-bold uppercase">Paid in Full</p>
                    </div>
                  </div>
                  {paymentPlan === "full" && (
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-yellow-500 text-slate-950 rounded-full p-1 border-4 border-slate-900">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div 
                  onClick={() => setPaymentPlan("installment")}
                  className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer group ${
                    paymentPlan === "installment" 
                      ? "border-yellow-500 bg-yellow-500/5" 
                      : "border-slate-800 hover:border-slate-700 bg-slate-950/50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-bold mb-1">Flexible Ledger</p>
                      <p className="text-xs text-slate-500">₦100k now, balance spread over 3 payments.</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xl font-black text-white font-mono">₦100k</p>
                       <p className="text-[10px] text-slate-500 font-bold uppercase">Deposit</p>
                    </div>
                  </div>
                  {paymentPlan === "installment" && (
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-yellow-500 text-slate-950 rounded-full p-1 border-4 border-slate-900">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
                  loading 
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                    : "bg-yellow-500 text-slate-950 hover:bg-yellow-400 hover:scale-[1.02] shadow-[0_0_30px_rgba(234,179,8,0.3)]"
                }`}
              >
                {loading ? "Processing Secure Link..." : "Apply & Initialize Payment"}
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center gap-6 text-[10px] text-slate-600 uppercase font-black tracking-widest mt-6">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3 h-3" />
                  Secured by Paystack
                </div>
                <div className="flex items-center gap-2">
                  <MonitorCheck className="w-3 h-3" />
                  Instant Provisioning
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
