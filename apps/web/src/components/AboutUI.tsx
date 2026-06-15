"use client";
import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Shield, GitMerge, Terminal, Cpu } from "lucide-react";
import { KybernNexusNavbar } from "@/components/KybernNexusNavbar";
import { KybernNexusFooter } from "@/components/KybernNexusFooter";

export function AboutUI() {
  return (
    <div className="min-h-screen bg-kn-bg text-kn-body font-sans selection:bg-kn-accent/30 selection:text-kn-heading">
      <KybernNexusNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-kn-bg border-b border-kn-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-kn-accent/10 via-kn-bg to-kn-bg pointer-events-none"></div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-sm font-bold text-kn-accent tracking-widest uppercase mb-6">ABOUT KYBERN NEXUS</h1>
          <h2 className="text-5xl md:text-7xl font-extrabold text-kn-heading tracking-tight mb-8">
            We bridge the gap between <span className="text-kn-accent">knowing</span> and <span className="text-kn-accent">doing</span>.
          </h2>
          <p className="text-xl md:text-2xl text-kn-muted leading-relaxed max-w-3xl mx-auto">
            Kybern Nexus is an elite cloud architecture firm and engineering academy. We build the infrastructure modern businesses run on, and we train the engineers who maintain it.
          </p>
        </div>
      </section>

      {/* The Problem (Deployment Paralysis) */}
      <section className="py-24 bg-kn-card border-b border-kn-border relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-sm font-bold text-red-500 tracking-widest uppercase mb-4">THE PROBLEM</h3>
              <h4 className="text-4xl font-extrabold text-kn-heading mb-6">Deployment Paralysis.</h4>
              <p className="text-lg text-kn-muted leading-relaxed mb-6">
                Most scaling companies hit a wall. Their cloud bills are too high, their systems crash when traffic spikes, and their engineering teams are terrified to release new features because it takes too long and breaks production.
              </p>
              <p className="text-lg text-kn-muted leading-relaxed">
                This isn&apos;t a code problem; it&apos;s an infrastructure problem. Founders and CTOs are forced to choose between moving fast and staying stable. We exist so you don&apos;t have to choose.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-red-500/20 to-transparent rounded-3xl transform translate-x-4 translate-y-4" />
              <img 
                src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80" 
                alt="Complex code on screen" 
                className="relative rounded-3xl shadow-2xl border border-kn-border z-10 w-full object-cover aspect-[4/3] grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* The Synergy (Consulting + Academy -> Staffing) */}
      <section className="py-24 bg-kn-bg border-b border-kn-border relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80')] bg-cover bg-center opacity-[0.03] mix-blend-screen pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h3 className="text-sm font-bold text-kn-accent tracking-widest uppercase mb-4">THE KYBERN SYNERGY</h3>
            <h4 className="text-4xl font-extrabold text-kn-heading max-w-3xl mx-auto">
              How our Consulting and Academy arms create the ultimate talent pipeline.
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection Line (Desktop Only) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-kn-border via-kn-accent to-kn-border transform -translate-y-1/2 z-0"></div>

            {/* Step 1: Consulting */}
            <div className="bg-kn-card border border-kn-border rounded-2xl p-8 relative z-10 shadow-xl hover:border-kn-accent/50 transition-colors group">
              <div className="w-16 h-16 bg-kn-bg border border-kn-accent/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-kn-accent/10 transition-colors">
                <Terminal className="w-8 h-8 text-kn-accent" />
              </div>
              <h5 className="text-xl font-bold text-kn-heading mb-3">1. Enterprise Consulting</h5>
              <p className="text-kn-muted leading-relaxed">
                We architect, migrate, and automate infrastructure for high-growth startups and enterprises. We solve the hardest cloud problems in production.
              </p>
            </div>

            {/* Step 2: Academy */}
            <div className="bg-kn-card border border-kn-border rounded-2xl p-8 relative z-10 shadow-xl hover:border-kn-accent/50 transition-colors group">
              <div className="w-16 h-16 bg-kn-bg border border-kn-accent/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-kn-accent/10 transition-colors">
                <GitMerge className="w-8 h-8 text-kn-accent" />
              </div>
              <h5 className="text-xl font-bold text-kn-heading mb-3">2. Real-World Curriculum</h5>
              <p className="text-kn-muted leading-relaxed">
                The lessons we learn on the frontlines of enterprise consulting form the exact curriculum we teach in the Kybern Academy. No toy examples.
              </p>
            </div>

            {/* Step 3: Staffing */}
            <div className="bg-kn-bg border-2 border-kn-accent rounded-2xl p-8 relative z-10 shadow-[0_0_30px_rgba(255,215,0,0.1)] transform md:-translate-y-4">
              <div className="w-16 h-16 bg-kn-accent rounded-xl flex items-center justify-center mb-6">
                <Cpu className="w-8 h-8 text-kn-bg" />
              </div>
              <h5 className="text-xl font-bold text-kn-heading mb-3">3. Elite Staff Augmentation</h5>
              <p className="text-kn-muted leading-relaxed mb-6">
                When clients need extra capacity, we embed our top Academy graduates directly into their teams. Pre-vetted, highly trained, and ready day one.
              </p>
              <Link href="/pricing" className="text-kn-accent font-bold flex items-center gap-2 hover:gap-3 transition-all">
                View Staffing Rates <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Engineering Standards (Firm Philosophy) */}
      <section className="py-24 bg-kn-bg relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h3 className="text-sm font-bold text-kn-accent tracking-widest uppercase mb-4">FIRM PHILOSOPHY</h3>
            <h4 className="text-4xl font-extrabold text-kn-heading">Our Engineering Standards</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="flex gap-6">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-kn-card border border-kn-border rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-kn-accent" />
                </div>
              </div>
              <div>
                <h5 className="text-xl font-bold text-kn-heading mb-2">Built to Fail Safely</h5>
                <p className="text-kn-muted leading-relaxed">
                  Systems we build expect failure. We design with redundancy and blast radius containment in mind, ensuring that when a component fails, the system stays online.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-kn-card border border-kn-border rounded-full flex items-center justify-center">
                  <Terminal className="w-6 h-6 text-kn-accent" />
                </div>
              </div>
              <div>
                <h5 className="text-xl font-bold text-kn-heading mb-2">Relentless Automation</h5>
                <p className="text-kn-muted leading-relaxed">
                  Manual processes are technical debt in disguise. We eliminate toil through infrastructure as code (Terraform), robust CI/CD, and automated recovery.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-kn-card border border-kn-border rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-kn-accent" />
                </div>
              </div>
              <div>
                <h5 className="text-xl font-bold text-kn-heading mb-2">Engineered for Growth</h5>
                <p className="text-kn-muted leading-relaxed">
                  We design for where you&apos;re going, not just where you are. Our architectures scale smoothly from your current stage to your next major milestone without massive rewrites.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-kn-card border border-kn-border rounded-full flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-kn-accent" />
                </div>
              </div>
              <div>
                <h5 className="text-xl font-bold text-kn-heading mb-2">Full Transparency</h5>
                <p className="text-kn-muted leading-relaxed">
                  Black boxes are dangerous. We ensure you always know what we built and why. Every system we hand over comes with documentation your team can actually understand and use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-kn-card border-t border-kn-border text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-kn-heading mb-6">Ready to work with us?</h2>
          <p className="text-xl text-kn-muted mb-10">
            Whether you need to overhaul your architecture or embed an elite engineer into your team, we are ready to build.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/consulting#contact" className="w-full sm:w-auto bg-kn-accent hover:brightness-110 text-kn-bg font-bold px-8 py-4 rounded-xl transition-all shadow-[0_0_15px_var(--kn-accent-glow)] flex items-center justify-center gap-2">
              Consult With Us <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/academy" className="w-full sm:w-auto bg-kn-bg border border-kn-border text-kn-heading font-bold px-8 py-4 rounded-xl hover:bg-kn-border transition-colors">
              Explore the Academy
            </Link>
          </div>
        </div>
      </section>

      <KybernNexusFooter />
    </div>
  );
}
