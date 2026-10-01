"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, ArrowRight, Sparkles } from "lucide-react";

// Strict Capstone Deadline: October 21, 2026 at 11:59:59 PM WAT (UTC+1)
const CAPSTONE_DEADLINE_MS = new Date("2026-10-21T23:59:59+01:00").getTime();

export function CapstoneDeadlineTicker() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    setMounted(true);

    const calculate = () => {
      const diff = CAPSTONE_DEADLINE_MS - Date.now();
      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isExpired: false,
      };
    };

    setTimeLeft(calculate());
    const interval = setInterval(() => {
      setTimeLeft(calculate());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Avoid hydration mismatch and hide once deadline has passed
  if (!mounted || timeLeft.isExpired) {
    return null;
  }

  const tickerItem = (
    <div className="flex items-center gap-8 px-6 whitespace-nowrap text-xs font-semibold">
      <span className="flex items-center gap-2 text-yellow-500 dark:text-yellow-400 font-bold uppercase tracking-wider">
        <AlertTriangle size={14} className="text-yellow-500 animate-pulse" />
        Capstone Submission Cutoff: October 21, 2026 &bull; 11:59 PM WAT
      </span>

      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 font-mono text-[11px] font-bold">
        <Clock size={12} />
        {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s remaining
      </span>

      <span className="text-foreground/90 font-medium">
        Submissions &amp; revisions lock permanently after this deadline.
      </span>

      <span className="text-red-500 dark:text-red-400 font-bold">
        Failure to submit means you cannot graduate and will not be published to the Alumni page.
      </span>

      <span className="inline-flex items-center gap-1 text-yellow-500 font-bold underline underline-offset-4 hover:text-yellow-400 transition-colors">
        Submit Final Project (PR) Now <ArrowRight size={12} />
      </span>

      <span className="text-muted-foreground/40 font-mono select-none">&bull;&bull;&bull;</span>
    </div>
  );

  return (
    <div className="sticky top-16 lg:top-0 z-30 w-full bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-950/40 backdrop-blur-md border-b border-yellow-500/30 overflow-hidden shadow-sm">
      <Link 
        href="/academy/dashboard/capstone" 
        className="flex items-center w-full py-2 hover:bg-yellow-500/5 transition-colors group"
      >
        {/* Left static badge */}
        <div className="shrink-0 z-10 px-3 sm:px-4 py-1 flex items-center gap-2 bg-yellow-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-r-full shadow-md mr-2">
          <Sparkles size={11} className="animate-spin" />
          <span className="hidden sm:inline">Graduation Cutoff</span>
          <span className="sm:hidden">Deadline</span>
        </div>

        {/* Marquee ticker track */}
        <div className="overflow-hidden w-full relative flex">
          <div className="animate-marquee flex items-center shrink-0">
            {tickerItem}
            {tickerItem}
          </div>
          <div className="animate-marquee flex items-center shrink-0" aria-hidden="true">
            {tickerItem}
            {tickerItem}
          </div>
        </div>
      </Link>
    </div>
  );
}
