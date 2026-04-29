"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * AutoRefresher is a silent client component that triggers router.refresh() 
 * periodically. This ensures that Server Components (like the main Dashboard)
 * stay in sync with the database automator without requiring a full page reload.
 */
export function AutoRefresher({ intervalMs = 60000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [router, intervalMs]);

  return null;
}
