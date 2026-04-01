"use client";

import { useState, useEffect } from "react";

export type RegistrationPhase = "pre-launch" | "open" | "closed";

// Target dates based on the prompt (WAT is UTC+1)
// April 2, 2026 12:00 PM WAT = April 2, 2026 11:00 AM UTC
const OPEN_DATE = new Date("2026-03-31T11:00:00Z").getTime(); // CHANGED FOR TESTING: originally "2026-04-02T11:00:00Z"
// April 12, 2026 12:00 PM WAT = April 12, 2026 11:00 AM UTC
const CLOSE_DATE = new Date("2026-04-12T11:00:00Z").getTime();

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function useRegistrationPhase() {
  const [phase, setPhase] = useState<RegistrationPhase>("pre-launch");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const calculateTime = () => {
      const now = new Date().getTime();
      let targetDate: number;

      if (now < OPEN_DATE) {
        setPhase("pre-launch");
        targetDate = OPEN_DATE;
      } else if (now >= OPEN_DATE && now < CLOSE_DATE) {
        setPhase("open");
        targetDate = CLOSE_DATE;
      } else {
        setPhase("closed");
        targetDate = CLOSE_DATE; // Not used when closed, but keeping structure
      }

      if (now < CLOSE_DATE) {
        const difference = targetDate - now;

        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTime(); // Initial run
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  return { phase, timeLeft, isMounted };
}
