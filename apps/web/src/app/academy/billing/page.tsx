"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getBillingHub,
  initiateBillingPayment,
  type BillingHub,
  type PaymentHistoryItem,
} from "@/app/academy/actions";
import { CreditCard, CheckCircle2, AlertTriangle, ShieldX, ArrowRight, ReceiptText, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

// ─── Formatters ────────────────────────────────────────────────────────────────

const fmt = (kobo: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(kobo / 100);

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
};

const fmtRef = (ref: string) => `${ref.slice(0, 8)}…${ref.slice(-6)}`;

const MIN_SECOND_PAYMENT = 75_000; // Naira
const TOTAL_DUE_KOBO = 25_000_000; // ₦250,000

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS = {
  good_standing: {
    label: "Good Standing",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  },
  payment_locked: {
    label: "Access Suspended",
    icon: <ShieldX className="w-4 h-4 text-red-400" />,
    cls: "bg-red-500/10 border-red-500/25 text-red-400",
  },
  paid_in_full: {
    label: "Paid in Full",
    icon: <CheckCircle2 className="w-4 h-4 text-yellow-400" />,
    cls: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
  },
} as const;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BillingHubPage() {
  const [hub, setHub] = useState<BillingHub | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getBillingHub().then((res) => {
      if ("error" in res) {
        setLoadError(res.error);
      } else {
        setHub(res);
        // Pre-fill amount for 2nd / 3rd payment
        const remaining = (res.billing.total_due - res.billing.total_paid) / 100;
        if (res.billing.total_paid > 0 && res.billing.billing_status !== "paid_in_full") {
          setAmount(String(remaining));
        }
      }
    });
  }, []);

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <ShieldX className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-muted-foreground text-sm">{loadError}</p>
          <Link href="/academy/dashboard" className="text-yellow-500 text-xs hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!hub) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-muted rounded-xl w-48" />
        <div className="h-40 bg-card rounded-3xl border border-border" />
        <div className="h-64 bg-card rounded-3xl border border-border" />
        <div className="h-48 bg-card rounded-3xl border border-border" />
      </div>
    );
  }

  const { billing, payment_history, payment_count } = hub;
  const remainingKobo = billing.total_due - billing.total_paid;
  const remainingNaira = remainingKobo / 100;
  const progressPct = Math.min((billing.total_paid / billing.total_due) * 100, 100);

  // Installment logic
  const depositPaid = billing.total_paid >= 10_000_000;      // ≥ ₦100k
  const twoPaymentsDone = billing.total_paid >= 17_500_000;  // ≥ ₦175k
  const isSecondPayment = depositPaid && !twoPaymentsDone && remainingKobo > 0;
  const isFinalPayment = twoPaymentsDone && remainingKobo > 0;
  const canPay = billing.billing_status !== "paid_in_full" && payment_count > 0;

  const statusCfg = STATUS[billing.billing_status] ?? STATUS.good_standing;

  const progressColor =
    billing.billing_status === "paid_in_full"
      ? "from-yellow-500 to-yellow-300"
      : billing.billing_status === "payment_locked"
      ? "from-red-500 to-red-400"
      : "from-cyan-500 to-emerald-400";

  const handleAmountChange = (val: string) => {
    setAmountError(null);
    if (!isFinalPayment) setAmount(val);
  };

  const handlePay = () => {
    const parsed = parseInt(amount, 10);
    if (isNaN(parsed) || parsed <= 0) {
      setAmountError("Please enter a valid amount.");
      return;
    }
    if (isSecondPayment && parsed < MIN_SECOND_PAYMENT) {
      setAmountError(`Minimum payment is ${fmt(MIN_SECOND_PAYMENT * 100)}.`);
      return;
    }
    if (parsed > remainingNaira) {
      setAmountError(`Cannot exceed the remaining balance of ${fmt(remainingKobo)}.`);
      return;
    }
    setPayError(null);
    startTransition(async () => {
      const result = await initiateBillingPayment(parsed);
      if ("error" in result) {
        setPayError(result.error ?? "Payment initialization failed.");
      } else {
        window.location.href = result.authorization_url;
      }
    });
  };

  return (
    <div className="space-y-8 max-w-3xl">

      {/* ── Page Header ── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Invoices</h1>
          <p className="text-muted-foreground text-sm">₦250,000 Cloud Native Mentorship — Payment Ledger</p>
        </div>
      </div>

      {/* ── Access Suspended Banner (payment_locked) ── */}
      {billing.billing_status === "payment_locked" && (
        <div className="flex items-start gap-4 bg-red-500/8 border border-red-500/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(239,68,68,0.08)]">
          <ShieldX className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-red-300 mb-1">Portal Access Suspended</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your access to curriculum modules is locked due to a missed installment.
              Complete a payment below to immediately restore full access.
            </p>
          </div>
        </div>
      )}

      {/* ── Ledger Overview Card ── */}
      <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
          <CreditCard className="w-48 h-48 -mr-8 -mt-8" />
        </div>

        {/* Status + summary row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 relative z-10">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${statusCfg.cls}`}>
            {statusCfg.icon}
            {statusCfg.label}
          </div>
          {billing.next_payment_due_date && billing.billing_status !== "paid_in_full" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Next due: <span className="font-semibold text-amber-400">{fmtDate(billing.next_payment_due_date)}</span>
            </div>
          )}
        </div>

        {/* Amount bars */}
        <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
          {[
            { label: "Total Paid", value: fmt(billing.total_paid), color: "text-emerald-400" },
            { label: "Remaining", value: fmt(remainingKobo), color: remainingKobo > 0 ? "text-red-400" : "text-emerald-400" },
            { label: "Total Due", value: fmt(TOTAL_DUE_KOBO), color: "text-slate-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-background/60 border border-border/60 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">{label}</p>
              <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="relative z-10">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">
            <span>Payment Progress</span>
            <span className={billing.billing_status === "paid_in_full" ? "text-yellow-500" : "text-slate-500"}>
              {progressPct.toFixed(0)}% Complete
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden border border-border/50">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-1000`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Milestone ticks */}
          <div className="flex justify-between mt-3">
            {[
              { pct: 40, label: "Deposit (₦100k)" },
              { pct: 70, label: "2nd Payment" },
              { pct: 100, label: "Cleared" },
            ].map(({ pct, label }) => (
              <div key={label} className="flex flex-col items-center gap-1" style={{ marginLeft: pct === 40 ? "40%" : 0 }}>
                <div className={`w-1 h-2 rounded-full ${billing.total_paid >= (TOTAL_DUE_KOBO * pct) / 100 ? "bg-yellow-500" : "bg-muted"}`} />
                <span className="text-[9px] text-muted-foreground/50 whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Payment Interface ── */}
      {canPay && (
        <div className="bg-card/50 border border-border rounded-3xl p-8">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-yellow-500" />
            </span>
            {isFinalPayment ? "Final Installment Payment" : "Make Installment Payment"}
          </h3>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {isFinalPayment ? "Final Balance (Locked)" : `Amount in Naira ${isSecondPayment ? `(Min ₦${MIN_SECOND_PAYMENT.toLocaleString()})` : ""}`}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg pointer-events-none">₦</span>
                <input
                  id="billing-amount-input"
                  type="number"
                  min={isSecondPayment ? MIN_SECOND_PAYMENT : 1}
                  max={remainingNaira}
                  value={amount}
                  readOnly={isFinalPayment}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder={isSecondPayment ? `Min ${MIN_SECOND_PAYMENT.toLocaleString()}` : String(remainingNaira)}
                  className={`w-full bg-background border rounded-xl pl-10 pr-4 py-4 text-xl font-bold font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500/30 transition-all ${
                    amountError ? "border-red-500/50" : "border-border focus:border-yellow-500/40"
                  } ${isFinalPayment ? "opacity-70 cursor-not-allowed" : ""}`}
                />
              </div>
              {amountError && (
                <div className="mt-2 flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {isFinalPayment
                    ? `Final installment is locked to the full remaining balance: ${fmt(remainingKobo)}`
                    : amountError}
                </div>
              )}
              {isFinalPayment && (
                <p className="mt-2 text-[10px] text-muted-foreground/50 leading-relaxed">
                  This is your 3rd and final installment. The amount is fixed to your remaining balance.
                </p>
              )}
            </div>

            {payError && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {payError}
              </div>
            )}

            <button
              id="billing-pay-btn"
              onClick={handlePay}
              disabled={isPending}
              className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-base uppercase tracking-widest transition-all duration-200 ${
                isPending
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-yellow-500 text-slate-950 hover:bg-yellow-400 hover:shadow-[0_0_25px_rgba(234,179,8,0.3)] shadow-[0_0_10px_rgba(234,179,8,0.15)] active:scale-[0.99]"
              }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Initializing Payment…
                </>
              ) : (
                <>
                  Proceed to Payment
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-[10px] text-muted-foreground/50 text-center">
              Secured by Paystack · 256-bit SSL Encrypted · Instant confirmation
            </p>
          </div>
        </div>
      )}

      {billing.billing_status === "paid_in_full" && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-3xl p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-yellow-400 mb-2">Program Fee Cleared!</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            You have successfully paid the full ₦250,000 program fee. Enjoy unrestricted access to all academy resources.
          </p>
        </div>
      )}

      {/* ── Transaction History ── */}
      <div className="bg-card/50 border border-border rounded-3xl p-8">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center">
            <ReceiptText className="w-4 h-4 text-muted-foreground" />
          </span>
          Transaction History
          <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 bg-muted px-2.5 py-1 rounded-full">
            {payment_history.length} record{payment_history.length !== 1 ? "s" : ""}
          </span>
        </h3>

        {payment_history.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl">
            <ReceiptText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No payments recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/60">
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">#</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Date</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Amount</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Gateway</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Reference</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {payment_history.map((tx: PaymentHistoryItem, idx: number) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-5 py-4 text-muted-foreground/60 font-mono text-xs">{payment_history.length - idx}</td>
                    <td className="px-5 py-4 text-muted-foreground text-xs whitespace-nowrap">{fmtDate(tx.created_at)}</td>
                    <td className="px-5 py-4">
                      <span className="font-bold font-mono text-emerald-400 text-sm">{fmt(tx.amount_paid)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {tx.gateway}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-[11px] text-muted-foreground font-mono bg-background px-2 py-1 rounded-lg border border-border">
                          {fmtRef(tx.reference_id)}
                        </code>
                        <a
                          href={`https://dashboard.paystack.com/#/transactions?reference=${tx.reference_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          title="View on Paystack"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-600 hover:text-yellow-500 transition-colors" />
                        </a>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Confirmed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
