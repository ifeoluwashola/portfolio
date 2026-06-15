"use client";
import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Globe2, MapPin, ArrowRight, Check, X, Send } from "lucide-react";
import { KybernNexusNavbar } from "@/components/KybernNexusNavbar";
import { KybernNexusFooter } from "@/components/KybernNexusFooter";

type Region = "global" | "africa";

export function PricingUI() {
  const [region, setRegion] = useState<Region>("global");
  
  const [formData, setFormData] = useState({ email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const pricingData = {
    global: {
      audit: "$3,500",
      fractional: "$4,000",
      academy: "$4,500",
    },
    africa: {
      audit: "$800",
      fractional: "$1,000",
      academy: "₦250,000",
    },
  };

  const currentPricing = pricingData[region];

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus("idle");
    setErrorMessage("");
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";
    try {
      const res = await fetch(`${apiBase}/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, message: "Requested a quote from Pricing Page." }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to submit"); }
      setFormStatus("success");
      setFormData({ email: "" });
    } catch (err: unknown) {
      setFormStatus("error");
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-kn-bg text-kn-body font-sans selection:bg-kn-accent/30 selection:text-kn-heading">
      <KybernNexusNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-kn-bg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-kn-accent/10 via-kn-bg to-kn-bg pointer-events-none"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-sm font-bold text-kn-accent tracking-widest uppercase mb-4">PLANS &amp; PRICING</h1>
          <h2 className="text-5xl md:text-6xl font-extrabold text-kn-heading tracking-tight mb-6">
            Senior DevOps capacity, billed <span className="text-kn-accent">how you want.</span>
          </h2>
          <p className="text-xl text-kn-muted leading-relaxed max-w-3xl mx-auto">
            You have two options: Do it yourself on nights and weekends, or put pre-vetted senior engineers in your Slack within a week. No lock-in, no hidden fees.
          </p>
        </div>
      </section>

      {/* Main Pricing Section */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Region Toggle */}
          <div className="mb-16">
            <div className="flex flex-col items-center text-center mb-8">
              <h3 className="text-2xl font-bold text-kn-heading mb-2">Purchasing Power Parity (PPP)</h3>
              <p className="text-kn-muted max-w-xl">We operate globally but price locally. Toggle your operating region below to see rates adjusted for your market.</p>
            </div>
            <div className="flex justify-center">
              <div className="relative flex items-center p-1 bg-kn-card border border-kn-border rounded-full w-max shadow-lg">
                <button
                  onClick={() => setRegion("global")}
                  className={`relative z-10 flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full transition-colors duration-300 ${
                    region === "global" ? "text-kn-bg" : "text-kn-muted hover:text-kn-heading"
                  }`}
                >
                  <Globe2 className="w-4 h-4" /> Global (US/UK/EU)
                </button>
                <button
                  onClick={() => setRegion("africa")}
                  className={`relative z-10 flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full transition-colors duration-300 ${
                    region === "africa" ? "text-kn-bg" : "text-kn-muted hover:text-kn-heading"
                  }`}
                >
                  <MapPin className="w-4 h-4" /> Africa / Emerging
                </button>
                <div 
                  className={`absolute inset-y-1 bg-kn-accent rounded-full transition-all duration-300 ease-out`}
                  style={{
                    left: region === "global" ? "0.25rem" : "50%",
                    width: "calc(50% - 0.25rem)",
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            
            {/* Card 1: The Audit */}
            <div className="bg-kn-card border border-kn-border rounded-3xl p-8 flex flex-col relative shadow-xl hover:border-kn-accent/50 transition-colors">
              <div className="mb-6">
                <span className="inline-flex rounded-full border border-kn-border bg-kn-bg px-2.5 py-0.5 text-xs font-semibold text-kn-accent mb-4">Advisory</span>
                <h3 className="text-2xl font-bold text-kn-heading mb-2">The Infrastructure Audit</h3>
                <p className="text-sm text-kn-muted">A comprehensive 2-week health check of your cloud environment.</p>
              </div>
              <div className="mb-8">
                <span className="text-sm font-semibold text-kn-muted uppercase tracking-wider">Starting at</span>
                <div className="mt-2 text-4xl font-black text-kn-accent">{currentPricing.audit}</div>
                <p className="text-xs text-kn-faded mt-1">100% credited toward implementation</p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-kn-accent shrink-0 mt-0.5" />
                  <span className="text-sm text-kn-body">Identify wasted cloud spend</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-kn-accent shrink-0 mt-0.5" />
                  <span className="text-sm text-kn-body">Security & vulnerability scan</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-kn-accent shrink-0 mt-0.5" />
                  <span className="text-sm text-kn-body">Architectural blueprint report</span>
                </li>
              </ul>
              <Link href="#contact" className="w-full text-center py-3 px-4 rounded-xl bg-kn-bg border border-kn-border text-kn-heading font-bold hover:bg-kn-border transition-colors">
                Book an Audit
              </Link>
            </div>

            {/* Card 2: Migration */}
            <div className="bg-kn-bg border-2 border-kn-accent rounded-3xl p-8 flex flex-col relative shadow-[0_0_30px_rgba(255,215,0,0.1)] lg:-translate-y-4">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-kn-accent via-kn-heading to-kn-accent"></div>
              <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-flex rounded-full border border-kn-accent/30 bg-kn-accent/10 px-2.5 py-0.5 text-xs font-semibold text-kn-accent">Project</span>
                  <span className="bg-kn-accent/10 text-kn-accent text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Most Common</span>
                </div>
                <h3 className="text-2xl font-bold text-kn-heading mb-2">Architecture & Migration</h3>
                <p className="text-sm text-kn-muted">Moving legacy systems to modern, scalable environments.</p>
              </div>
              <div className="mb-8">
                <span className="text-sm font-semibold text-kn-muted uppercase tracking-wider">Project Based</span>
                <div className="mt-2 text-4xl font-black text-kn-heading">Custom Quote</div>
                <p className="text-xs text-kn-faded mt-1">Priced by milestone, not by the hour</p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-kn-accent shrink-0 mt-0.5" />
                  <span className="text-sm text-kn-body">Zero-downtime migrations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-kn-accent shrink-0 mt-0.5" />
                  <span className="text-sm text-kn-body">CI/CD pipeline automation</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-kn-accent shrink-0 mt-0.5" />
                  <span className="text-sm text-kn-body">Kubernetes cluster rebuilds</span>
                </li>
              </ul>
              <Link href="#contact" className="w-full text-center py-3 px-4 rounded-xl bg-kn-accent text-kn-bg font-bold hover:brightness-110 transition-all shadow-[0_0_15px_var(--kn-accent-glow)]">
                Discuss Your Project
              </Link>
            </div>

            {/* Card 3: Staff Aug */}
            <div className="bg-kn-card border border-kn-border rounded-3xl p-8 flex flex-col relative shadow-xl hover:border-kn-accent/50 transition-colors">
              <div className="mb-6">
                <span className="inline-flex rounded-full border border-kn-border bg-kn-bg px-2.5 py-0.5 text-xs font-semibold text-kn-accent mb-4">Retainer</span>
                <h3 className="text-2xl font-bold text-kn-heading mb-2">Staff Augmentation</h3>
                <p className="text-sm text-kn-muted">Embed pre-vetted cloud engineers into your daily operations.</p>
              </div>
              <div className="mb-8">
                <span className="text-sm font-semibold text-kn-muted uppercase tracking-wider">Starting at</span>
                <div className="mt-2 text-4xl font-black text-kn-heading">{currentPricing.fractional}<span className="text-lg text-kn-muted font-medium">/mo</span></div>
                <p className="text-xs text-kn-faded mt-1">Enterprise capacity, fractional cost</p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-kn-accent shrink-0 mt-0.5" />
                  <span className="text-sm text-kn-body">Named engineer embedded with your team</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-kn-accent shrink-0 mt-0.5" />
                  <span className="text-sm text-kn-body">Backed by Kybern Nexus architects</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-kn-accent shrink-0 mt-0.5" />
                  <span className="text-sm text-kn-body">Zero recruiting risk or lead time</span>
                </li>
              </ul>
              <Link href="#contact" className="w-full text-center py-3 px-4 rounded-xl bg-kn-bg border border-kn-border text-kn-heading font-bold hover:bg-kn-border transition-colors">
                Request Talent
              </Link>
            </div>

          </div>

          {/* Kybern Academy Section */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-kn-heading mb-4">Kybern Academy</h2>
              <p className="text-kn-muted text-lg max-w-2xl mx-auto">Production-grade technical education. We train engineers exactly how we train our own consultants.</p>
            </div>
            <div className="max-w-4xl mx-auto bg-kn-card border border-kn-border rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 hover:border-kn-accent/50 transition-colors shadow-xl">
              <div className="max-w-xl">
                <span className="inline-flex rounded-full border border-kn-accent/30 bg-kn-accent/10 px-2.5 py-0.5 text-xs font-semibold text-kn-accent mb-4">Training Bootcamp</span>
                <h3 className="text-2xl font-bold text-kn-heading mb-2">4-Month DevOps Engineering</h3>
                <p className="text-kn-muted mb-6">
                  An intensive, hands-on program designed to take you from knowing the theory to deploying production-ready cloud architectures. Built for the next generation of elite engineers.
                </p>
                <div className="flex flex-wrap gap-4 text-sm font-bold text-kn-heading">
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-kn-accent" /> AWS & Kubernetes</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-kn-accent" /> CI/CD Automation</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-kn-accent" /> Infrastructure as Code</span>
                </div>
              </div>
              <div className="w-full md:w-auto flex-shrink-0 flex flex-col items-center md:items-end">
                <span className="text-sm font-semibold text-kn-muted uppercase tracking-wider mb-2">Flat Rate Tuition</span>
                <div className="text-4xl font-black text-kn-heading mb-6">{currentPricing.academy}</div>
                <Link href="/academy" className="w-full md:w-auto flex items-center justify-center gap-2 py-4 px-8 rounded-xl bg-kn-bg border border-kn-border text-kn-heading font-bold hover:bg-kn-border transition-colors">
                  View Syllabus
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Comparison Matrix */}
      <section className="py-16 bg-kn-card border-y border-kn-border relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-kn-heading mb-4">Compare Engagement Models</h2>
            <p className="text-kn-muted text-lg">Pick the commitment that fits how your work actually arrives.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-kn-border">
                  <th className="py-4 px-4 font-bold text-kn-muted w-1/4">Feature</th>
                  <th className="py-4 px-4 font-bold text-kn-heading w-1/4">The Audit</th>
                  <th className="py-4 px-4 font-bold text-kn-accent w-1/4">Migration</th>
                  <th className="py-4 px-4 font-bold text-kn-heading w-1/4">Staff Augmentation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kn-border text-sm">
                <tr>
                  <td className="py-4 px-4 font-medium text-kn-muted">Scope</td>
                  <td className="py-4 px-4 font-semibold text-kn-heading">Fixed (2 Weeks)</td>
                  <td className="py-4 px-4 font-semibold text-kn-heading">Predefined</td>
                  <td className="py-4 px-4 font-semibold text-kn-heading">Dynamic</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-kn-muted">Capacity</td>
                  <td className="py-4 px-4 font-semibold text-kn-heading">Architect</td>
                  <td className="py-4 px-4 font-semibold text-kn-heading">Pod/Team</td>
                  <td className="py-4 px-4 font-semibold text-kn-heading">Steady Monthly</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-kn-muted">Rate</td>
                  <td className="py-4 px-4 font-semibold text-kn-heading">Flat Fee</td>
                  <td className="py-4 px-4 font-semibold text-kn-heading">Milestone Based</td>
                  <td className="py-4 px-4 font-semibold text-kn-heading">Monthly Retainer</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-kn-muted">Work Type</td>
                  <td className="py-4 px-4 font-semibold text-kn-heading">Advisory & Review</td>
                  <td className="py-4 px-4 font-semibold text-kn-heading">Any (Project)</td>
                  <td className="py-4 px-4 font-semibold text-kn-heading">Ongoing Operations</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-kn-muted">Best For</td>
                  <td className="py-4 px-4 font-semibold text-kn-heading">Evaluating environment before big bets</td>
                  <td className="py-4 px-4 font-semibold text-kn-heading">Executing large roadmaps with clear exit</td>
                  <td className="py-4 px-4 font-semibold text-kn-heading">Ongoing capacity in your channels</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Quick Contact Form (Like MeteorOps Email Capture) */}
      <section id="contact" className="py-24 bg-kn-bg relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-kn-heading mb-4">Tell us what you need.</h2>
          <p className="text-kn-muted text-lg mb-8">We will reply with exact numbers and a clear perspective.</p>
          
          <form className="flex flex-col sm:flex-row gap-3 w-full max-w-xl mx-auto" onSubmit={handleQuoteSubmit}>
            <input 
              type="email" 
              placeholder="Enter your email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({email: e.target.value})}
              className="flex-1 bg-kn-card border border-kn-border rounded-xl px-4 py-4 text-kn-heading placeholder:text-kn-faded focus:outline-none focus:ring-2 focus:ring-kn-accent focus:border-kn-accent transition-all"
            />
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-kn-accent hover:brightness-110 text-kn-bg font-bold px-8 py-4 rounded-xl transition-all shadow-[0_0_15px_var(--kn-accent-glow)] flex items-center justify-center disabled:opacity-70"
            >
              {isSubmitting ? "Sending..." : "Get a Price Quote"}
            </button>
          </form>
          {formStatus === "success" && (
            <p className="mt-4 text-kn-accent text-sm font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Got it. We&apos;ll be in touch shortly.
            </p>
          )}
          {formStatus === "error" && (
            <p className="mt-4 text-red-500 text-sm font-medium flex items-center justify-center gap-2">
              <X className="w-4 h-4" /> {errorMessage}
            </p>
          )}
        </div>
      </section>

      <KybernNexusFooter />
    </div>
  );
}
