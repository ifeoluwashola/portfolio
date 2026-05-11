"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to console (swap for a real error-reporting service if needed)
    console.error("[Kybern Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      {/* Radial glow — red tint for error state */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <div className="h-[500px] w-[500px] rounded-full bg-red-500/10 blur-[120px] opacity-50" />
      </div>

      <div className="relative z-10 text-center max-w-lg w-full">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping opacity-30" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-400"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>
        </div>

        {/* Monospace label */}
        <p className="font-mono text-xs tracking-[0.25em] uppercase text-red-400 mb-4">
          System Exception
        </p>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-tight">
          Something went wrong
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base mb-3 leading-relaxed">
          An unexpected error occurred while loading this page. Our team has been notified.
          You can try again or return home.
        </p>

        {/* Error detail — only in dev */}
        {process.env.NODE_ENV === "development" && error?.message && (
          <div className="mb-8 mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-left">
            <p className="text-xs font-mono text-red-400 break-all leading-relaxed">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-muted-foreground mt-1">
                digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
          >
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors"
          >
            ← Back to Home
          </a>
        </div>

        {/* Footer note */}
        <p className="mt-12 text-xs text-muted-foreground/50 font-mono">
          KYBERN NEXUS · RUNTIME ERROR
        </p>
      </div>
    </div>
  );
}
