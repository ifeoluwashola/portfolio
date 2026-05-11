"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, CreditCard, Clock, TrendingUp, CheckCircle, XCircle, X } from "lucide-react";
import { getCohortApplications, grantScholarship } from "../actions";

interface CohortApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  current_role: string;
  payment_status: string;
  created_at: string;
}

interface CohortMetrics {
  total_applications: number;
  paid_seats: number;
  pending_seats: number;
  total_revenue: number;
}

interface AdminCohortResponse {
  metrics: CohortMetrics;
  applications: CohortApplication[];
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

let toastId = 0;

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-sm max-w-sm w-full animate-in slide-in-from-bottom-4 fade-in duration-300 ${
            t.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300"
              : "bg-red-950/90 border-red-500/30 text-red-300"
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {t.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
          </div>
          <p className="text-sm font-medium flex-1 leading-snug">{t.message}</p>
          <button
            onClick={() => onDismiss(t.id)}
            className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case "Paid":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Partial":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    default:
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }
}

export default function AdminCohortPage() {
  const [data, setData] = useState<AdminCohortResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const [scholarshipModalOpen, setScholarshipModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [scholarshipType, setScholarshipType] = useState<"full" | "partial">("full");
  const [scholarshipAmount, setScholarshipAmount] = useState<string>("");
  const [submittingScholarship, setSubmittingScholarship] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await getCohortApplications();
    if (res.error) {
      if (res.status === 401) {
        router.push("/admin/login");
      } else {
        setError(res.error);
      }
    } else if (res.data) {
      setData(res.data);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGrantScholarship = async () => {
    if (!selectedAppId) return;
    setSubmittingScholarship(true);
    try {
      const amount = scholarshipType === "full" ? 250000 : parseInt(scholarshipAmount || "0", 10);
      const res = await grantScholarship(selectedAppId, amount);
      if (res.error) {
        showToast("error", `Failed to grant scholarship: ${res.error}`);
      } else {
        setScholarshipModalOpen(false);
        showToast("success", scholarshipType === "full"
          ? "Full scholarship granted — student account provisioned and welcome email sent."
          : `Partial scholarship of ₦${parseInt(scholarshipAmount).toLocaleString()} applied successfully.`
        );
        await fetchData();
      }
    } catch {
      showToast("error", "An unexpected error occurred. Please try again.");
    }
    setSubmittingScholarship(false);
  };

  if (loading) return <div className="text-muted-foreground animate-pulse">Loading cohort data...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!data) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Cohort 1 Applications</h1>
        <p className="text-muted-foreground">Manage student registrations, payments, and onboarding.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Applications</h3>
            <Users className="w-5 h-5 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">{data.metrics.total_applications}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Enrolled Seats</h3>
            <CreditCard className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">{data.metrics.paid_seats}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Seats</h3>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">{data.metrics.pending_seats}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            ₦{data.metrics.total_revenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground text-xs uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Phone</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {data.applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No applications received yet.
                  </td>
                </tr>
              ) : (
                data.applications.map((app) => {
                  const isPaid = app.payment_status === "Paid";
                  const cleanPhone = app.phone.replace(/[^+\d]/g, "");

                  return (
                    <tr key={app.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                        {app.first_name} {app.last_name}
                      </td>
                      <td className="px-6 py-4 truncate max-w-[200px]">{app.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{app.phone}</td>
                      <td className="px-6 py-4 capitalize">{app.current_role}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(app.payment_status)}`}
                        >
                          {app.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-end gap-2">
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-full px-3 py-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 transition-colors whitespace-nowrap"
                          >
                            Open WhatsApp
                          </a>
                          {!isPaid && (
                            <button
                              onClick={() => {
                                setSelectedAppId(app.id);
                                setScholarshipType("full");
                                setScholarshipAmount("");
                                setScholarshipModalOpen(true);
                              }}
                              className="inline-flex items-center justify-center w-full px-3 py-1.5 text-xs font-medium text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-lg border border-yellow-500/20 transition-colors whitespace-nowrap"
                            >
                              Grant Scholarship
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scholarship Modal */}
      {scholarshipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">Grant Scholarship</h2>
              <button
                onClick={() => setScholarshipModalOpen(false)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Select whether this scholarship covers the full tuition or a partial amount. The billing ledger will be updated automatically.
            </p>

            {/* Scholarship Type Selection */}
            <div className="mb-5 space-y-3">
              <label
                className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-colors ${
                  scholarshipType === "full"
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-border hover:border-border/80 hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="scholarshipType"
                  value="full"
                  checked={scholarshipType === "full"}
                  onChange={() => setScholarshipType("full")}
                  className="w-4 h-4 accent-emerald-500"
                />
                <div>
                  <p className="text-sm font-semibold">Full Scholarship</p>
                  <p className="text-xs text-muted-foreground">Covers the entire ₦250,000 tuition fee</p>
                </div>
                <span className="ml-auto text-sm font-bold text-emerald-500">₦250,000</span>
              </label>

              <label
                className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-colors ${
                  scholarshipType === "partial"
                    ? "border-blue-500/50 bg-blue-500/5"
                    : "border-border hover:border-border/80 hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="scholarshipType"
                  value="partial"
                  checked={scholarshipType === "partial"}
                  onChange={() => setScholarshipType("partial")}
                  className="w-4 h-4 accent-blue-500"
                />
                <div>
                  <p className="text-sm font-semibold">Partial Scholarship</p>
                  <p className="text-xs text-muted-foreground">Covers a specific portion of the fee</p>
                </div>
              </label>
            </div>

            {/* Partial Amount Input */}
            {scholarshipType === "partial" && (
              <div className="mb-5">
                <label className="block text-sm font-medium mb-1.5">
                  Scholarship Amount <span className="text-muted-foreground">(₦)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">₦</span>
                  <input
                    type="number"
                    value={scholarshipAmount}
                    onChange={(e) => setScholarshipAmount(e.target.value)}
                    placeholder="e.g. 100000"
                    min={1}
                    max={250000}
                    className="w-full pl-8 pr-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm transition-colors"
                  />
                </div>
                {scholarshipAmount && parseInt(scholarshipAmount) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Remaining balance: ₦{Math.max(0, 250000 - parseInt(scholarshipAmount)).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setScholarshipModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                disabled={submittingScholarship}
              >
                Cancel
              </button>
              <button
                onClick={handleGrantScholarship}
                className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={
                  submittingScholarship ||
                  (scholarshipType === "partial" &&
                    (!scholarshipAmount || parseInt(scholarshipAmount) <= 0))
                }
              >
                {submittingScholarship ? "Processing…" : "Confirm Grant"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
