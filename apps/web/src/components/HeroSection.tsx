"use client";

import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Terminal, Database, Server, Cloud, Network } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#0f172a] pt-24 pb-32 sm:pt-32 sm:pb-40 lg:pb-48">
      {/* Layer 1: Tech Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* The prominent grid pattern */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:3rem_3rem]"
          style={{ maskImage: "radial-gradient(ellipse 80% 60% at 50% 10%, #000 30%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 10%, #000 30%, transparent 100%)" }}
        ></div>
        {/* Glowing Aurora Effects */}
        <div className="absolute left-[10%] right-0 top-[0%] m-auto h-[400px] w-[400px] rounded-full bg-[#eab308]/10 dark:bg-[#eab308]/20 blur-[100px]"></div>
        <div className="absolute left-[50%] right-0 top-[20%] m-auto h-[400px] w-[400px] rounded-full bg-[#eab308]/10 dark:bg-[#eab308]/20 blur-[100px]"></div>
      </div>

      {/* Layer 2: Floating Hardware Icons */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Server className="absolute top-[20%] left-[15%] w-16 h-16 text-[#eab308]/30 dark:text-[#eab308]/40 animate-[bounce_8s_infinite]" />
        <Cloud className="absolute top-[25%] right-[15%] w-24 h-24 text-[#eab308]/30 dark:text-[#eab308]/40 animate-[bounce_6s_infinite]" />
        <Database className="absolute bottom-[20%] left-[25%] w-12 h-12 text-[#eab308]/30 dark:text-[#eab308]/40 animate-[pulse_4s_infinite]" />
        <Network className="absolute bottom-[25%] right-[25%] w-16 h-16 text-[#eab308]/30 dark:text-[#eab308]/40 animate-[pulse_5s_infinite]" />
      </div>

      {/* Layer 3: Main Content */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-4 py-1.5 text-sm leading-6 text-slate-400 ring-1 ring-slate-800 hover:ring-slate-600 bg-[#0f172a]/50 backdrop-blur-sm transition-all shadow-sm">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#eab308] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#eab308]"></span>
                </span>
                Senior DevOps & Cloud Engineer.{" "}
                <Link href="#services" className="font-semibold text-yellow-600 dark:text-[#eab308] hover:text-[#eab308] transition-colors">
                  View Consulting Services <span aria-hidden="true">&rarr;</span>
                </Link>
              </span>
            </div>
          </div>
          
          <h1 className="text-5xl tracking-tight text-white sm:text-7xl font-extrabold flex flex-col gap-2">
            <span>Optimizing Cloud ROI</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#eab308]/10 via-[#eab308]/5 to-transparent animate-gradient-x">through DevOps.</span>
          </h1>
          
          <p className="mt-8 text-lg leading-8 text-slate-400 max-w-2xl mx-auto">
            Helping companies scale reliably and reduce costs. Specializing in high-performance infrastructure, seamless CI/CD pipelines, and secure cloud environments.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link 
              href="#contact" 
              className={cn(buttonVariants({ size: "lg" }), "bg-[#eab308] hover:bg-[#eab308] text-white gap-2 font-semibold shadow-lg shadow-[#eab308]/20 hover:shadow-[#eab308]/40 transition-all h-12 px-8 cursor-pointer")}
            >
              <Terminal size={18} />
              Book an Audit
            </Link>
            <Link 
              href="#projects" 
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2 border-slate-800 hover:bg-accent hover:text-accent-foreground h-12 px-8 bg-[#0f172a]/50 backdrop-blur-sm cursor-pointer")}
            >
              View Portfolio <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
