"use client";

import React, { useState } from "react";
import { CheckCircle2, Globe2, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";

type Region = "global" | "africa";

export function PricingSection() {
  const [region, setRegion] = useState<Region>("global");

  const pricingData = {
    global: {
      audit: "$3,500",
      fractional: "$4,000",
    },
    africa: {
      audit: "$800",
      fractional: "$1,000",
    },
  };

  const currentPricing = pricingData[region];

  return (
    <section id="pricing" className="py-24 sm:py-32 bg-kn-bg border-t border-kn-border relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-kn-accent/5 via-kn-bg to-kn-bg"></div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl lg:text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-kn-accent tracking-widest uppercase">TRANSPARENT PRICING</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-kn-heading sm:text-4xl">
            We sell business outcomes, not hours of coding.
          </p>
          <p className="mt-6 text-lg leading-8 text-kn-muted">
            We operate globally but price locally. Toggle your operating region below to see rates adjusted for Purchasing Power Parity (PPP).
          </p>

          {/* Region Toggle */}
          <div className="mt-10 flex justify-center">
            <div className="relative flex items-center p-1 bg-kn-card border border-kn-border rounded-full w-max">
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
              
              {/* Toggle Slider */}
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

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Card 1: The Audit */}
          <div className="bg-kn-card border border-kn-border rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:border-kn-accent/50 transition-colors">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-kn-heading mb-2">The Infrastructure Audit</h3>
              <p className="text-sm text-kn-muted h-10">A comprehensive 2-week health check of your cloud environment.</p>
            </div>
            <div className="mb-6">
              <span className="text-sm font-semibold text-kn-muted uppercase tracking-wider">Starting at</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-black text-kn-accent">{currentPricing.audit}</span>
              </div>
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
                <span className="text-sm text-kn-body">Executive report & architectural blueprint</span>
              </li>
            </ul>
            <div className="mt-auto pt-6 border-t border-kn-border">
              <p className="text-sm font-bold text-kn-heading mb-4 italic">
                * 100% credited toward implementation if you hire us for the migration.
              </p>
              <Link href="#contact" className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-kn-bg border border-kn-border text-kn-heading font-bold hover:bg-kn-border transition-colors">
                Book an Audit
              </Link>
            </div>
          </div>

          {/* Card 2: Migration (Highlighted) */}
          <div className="bg-kn-bg border-2 border-kn-accent rounded-3xl p-8 flex flex-col relative overflow-hidden shadow-[0_0_30px_rgba(255,215,0,0.1)] transform md:-translate-y-4">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-kn-accent via-kn-heading to-kn-accent"></div>
            <div className="mb-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-kn-heading">Architecture & Migration</h3>
                <span className="bg-kn-accent/10 text-kn-accent text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Most Common</span>
              </div>
              <p className="text-sm text-kn-muted h-10">Moving legacy systems to modern, automated, and scalable environments.</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-black text-kn-heading">Custom Quote</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-kn-accent shrink-0 mt-0.5" />
                <span className="text-sm text-kn-body">Zero-downtime infrastructure migrations</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-kn-accent shrink-0 mt-0.5" />
                <span className="text-sm text-kn-body">Complete CI/CD pipeline automation</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-kn-accent shrink-0 mt-0.5" />
                <span className="text-sm text-kn-body">Kubernetes (EKS/GKE) cluster rebuilds</span>
              </li>
            </ul>
            <div className="mt-auto pt-6 border-t border-kn-border">
              <p className="text-sm font-bold text-kn-heading mb-4 italic">
                * Priced by milestone, not by the hour. You pay for outcomes, not timesheets.
              </p>
              <Link href="#contact" className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-kn-accent text-kn-bg font-bold hover:bg-kn-heading transition-colors">
                Discuss Your Project <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Fractional Retainer */}
          <div className="bg-kn-card border border-kn-border rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:border-kn-accent/50 transition-colors">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-kn-heading mb-2">Fractional Lead DevOps</h3>
              <p className="text-sm text-kn-muted h-10">Ongoing architectural guidance and high-level infrastructure leadership.</p>
            </div>
            <div className="mb-6">
              <span className="text-sm font-semibold text-kn-muted uppercase tracking-wider">Starting at</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-black text-kn-heading">{currentPricing.fractional}</span>
                <span className="text-sm font-medium text-kn-muted">/ month</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-kn-accent shrink-0 mt-0.5" />
                <span className="text-sm text-kn-body">Direct embedding with your engineering team</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-kn-accent shrink-0 mt-0.5" />
                <span className="text-sm text-kn-body">Weekly architecture reviews & planning</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-kn-accent shrink-0 mt-0.5" />
                <span className="text-sm text-kn-body">Priority emergency escalation support</span>
              </li>
            </ul>
            <div className="mt-auto pt-6 border-t border-kn-border">
              <p className="text-sm font-bold text-kn-heading mb-4 italic">
                * Enterprise leadership without the massive full-time payroll.
              </p>
              <Link href="#contact" className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-kn-bg border border-kn-border text-kn-heading font-bold hover:bg-kn-border transition-colors">
                Secure a Retainer
              </Link>
            </div>
          </div>

        </div>

        {/* Staff Augmentation Wide Card */}
        <div className="bg-kn-card border border-kn-border rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 hover:border-kn-accent/50 transition-colors">
          <div className="max-w-2xl">
            <h3 className="text-2xl font-bold text-kn-heading mb-2">DevOps Staff Augmentation</h3>
            <p className="text-kn-muted mb-4">
              Need extra hands on deck? Don&apos;t spend 3 months recruiting. We can embed pre-vetted engineers trained specifically on enterprise infrastructure via the Kybern Academy directly into your daily operations.
            </p>
            <div className="flex items-center gap-4 text-sm font-bold text-kn-heading">
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-kn-accent" /> Flat Monthly Rate</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-kn-accent" /> Zero Recruiting Risk</span>
            </div>
          </div>
          <div className="w-full md:w-auto flex-shrink-0">
            <Link href="#contact" className="w-full md:w-auto flex items-center justify-center gap-2 py-4 px-8 rounded-xl bg-kn-bg border border-kn-border text-kn-heading font-bold hover:bg-kn-border transition-colors">
              Request Talent
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
