import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      {/* Radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <div className="h-[500px] w-[500px] rounded-full bg-[--kn-accent-glow] blur-[120px] opacity-40" />
      </div>

      <div className="relative z-10 text-center max-w-lg w-full">
        {/* Glitchy 404 number */}
        <div className="relative inline-block mb-6 select-none">
          <span
            className="block text-[clamp(6rem,20vw,10rem)] font-black leading-none tracking-tighter"
            style={{
              color: "transparent",
              WebkitTextStroke: "2px var(--kn-accent)",
              textShadow: "0 0 40px var(--kn-accent-glow)",
            }}
          >
            404
          </span>
        </div>

        {/* Monospace label */}
        <p className="font-mono text-xs tracking-[0.25em] uppercase text-[--kn-accent] mb-4">
          Signal Lost
        </p>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-tight">
          This page doesn&apos;t exist
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base mb-10 leading-relaxed">
          The URL you requested couldn&apos;t be found. It may have been moved,
          deleted, or never existed. Check the address and try again.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-[--kn-accent] text-[--kn-bg] hover:opacity-90 transition-opacity shadow-lg shadow-[--kn-accent-glow]"
          >
            ← Back to Home
          </Link>
          <Link
            href="/consulting"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors"
          >
            Contact Support
          </Link>
        </div>

        {/* Footer note */}
        <p className="mt-12 text-xs text-muted-foreground/50 font-mono">
          KYBERN NEXUS · ERROR 404
        </p>
      </div>
    </div>
  );
}
