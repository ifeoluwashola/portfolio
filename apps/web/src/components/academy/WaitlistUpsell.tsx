"use client";

import React, { useState } from "react";
import { Loader2, CreditCard, ChevronRight } from "lucide-react";

interface WaitlistUpsellProps {
  email: string;
}

export function WaitlistUpsell({ email }: WaitlistUpsellProps) {
  const [amount, setAmount] = useState<number>(10000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 5000) {
      setError("Minimum deposit amount is ₦5,000");
      return;
    }
    setLoading(true);
    setError('');

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";
    try {
      const res = await fetch(`${apiBase}/v1/waitlist/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          email,
          amount_ngn: amount,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to initialize deposit");
      }

      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No payment link returned from gateway");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong initializing checkout.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
        <p className="text-sm text-emerald-400 font-semibold leading-relaxed">
          ✅ You are on the waitlist! Cohort 2 seats are highly competitive. You can secure your priority spot right now by making a flexible commitment deposit.
        </p>
      </div>

      <form onSubmit={handleCheckout} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] ml-1 flex">
            Deposit Amount (NGN)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-black text-lg">
              ₦
            </span>
            <input
              type="number"
              min="5000"
              required
              placeholder="10,000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-background border border-border rounded-2xl pl-10 pr-5 py-4 text-lg font-mono text-foreground focus:outline-none focus:border-yellow-500/40 transition-all font-semibold"
            />
          </div>
          <p className="text-[10px] text-muted-foreground/60 ml-1">
            Minimum: ₦5,000. Deposits are fully credited toward your eventual tuition balance.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-500 font-semibold">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group w-full flex items-center justify-center gap-3 py-5 bg-yellow-500 text-slate-950 hover:bg-yellow-400 disabled:bg-muted disabled:text-muted-foreground font-black uppercase tracking-widest text-xs rounded-2xl transition-all duration-200 shadow-[0_4px_20px_rgba(234,179,8,0.15)] hover:shadow-[0_0_40px_rgba(234,179,8,0.3)] hover:scale-[1.01] active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Redirecting to Paystack...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Secure My Seat
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
