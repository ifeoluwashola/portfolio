"use client";

import { useRegistrationPhase } from "@/hooks/useRegistrationPhase";

export function CountdownTimer() {
  const { phase, timeLeft, isMounted } = useRegistrationPhase();

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-background/50 border border-border backdrop-blur-md rounded-2xl animate-pulse w-full max-w-lg mx-auto">
        <div className="h-20" />
      </div>
    );
  }

  const renderTimerBlocks = () => (
    <div className="flex space-x-4 mt-6">
      {[
        { label: "DAYS", value: timeLeft.days },
        { label: "HOURS", value: timeLeft.hours },
        { label: "MINS", value: timeLeft.minutes },
        { label: "SECS", value: timeLeft.seconds },
      ].map((block, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="flex items-center justify-center bg-card border border-emerald-500/30 text-emerald-400 font-mono text-3xl sm:text-4xl font-bold w-16 h-16 sm:w-20 sm:h-20 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            {block.value.toString().padStart(2, "0")}
          </div>
          <span className="text-xs text-muted-foreground mt-2 font-medium tracking-wider">
            {block.label}
          </span>
        </div>
      ))}
    </div>
  );

  const scrollToForm = () => {
    const el = document.getElementById("registration-form");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  if (phase === "closed") {
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-10 w-full max-w-lg mx-auto border border-red-500/30 rounded-2xl bg-red-500/5">
        <h3 className="text-2xl font-bold text-red-400 font-mono tracking-tight">
          Cohort 1 Registration Closed
        </h3>
        <p className="mt-2 text-muted-foreground">
          Sign up below to be notified for Cohort 2.
        </p>
        <button
          onClick={scrollToForm}
          className="mt-6 w-full py-3 px-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold border border-red-500/30 transition-all cursor-pointer"
        >
          Join Waitlist
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-12 w-full">
      <div className="inline-flex items-center px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-semibold mb-6">
        <span className="mr-2 relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        {phase === "pre-launch" ? "Registration Opens In..." : "Registration Closes In..."}
      </div>

      {renderTimerBlocks()}

      <div className="mt-10 w-full max-w-md mx-auto">
        <button
          onClick={phase === "open" ? scrollToForm : undefined}
          disabled={phase === "pre-launch"}
          className={`w-full py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 transform active:scale-[0.98] ${
            phase === "pre-launch"
              ? "bg-secondary text-muted-foreground cursor-not-allowed border border-border"
              : "bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] shadow-[0_0_10px_rgba(16,185,129,0.2)]"
          }`}
        >
          {phase === "pre-launch" ? "Registration Opens Soon" : "Secure Your Spot"}
        </button>
      </div>
    </div>
  );
}
