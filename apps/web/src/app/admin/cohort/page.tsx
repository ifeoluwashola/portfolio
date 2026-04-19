"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, CreditCard, Clock, TrendingUp } from "lucide-react";

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



export default function AdminCohortPage() {
  const [data, setData] = useState<AdminCohortResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchCohortData() {
      try {
        const res = await fetch("/api/v1/admin/cohort-applications", {
          cache: "no-store",
        });
        
        // Wait, I should use the adminFetch pattern to keep it consistent.
        // Actually, fetching from a client component directly to /api/v1/...
        // requires the cookie. The browser sends it.
        // But the user mentioned "mapping", and I see the proxy route was probably used
        // because of some middleware or path issue.
        
        // Let's check the API route in main.go again.
        // mux.HandleFunc("GET /api/admin/cohort-applications", authMW.RequireAuth(academyHandler.HandleGetAdminApplications))
        
        const response = await fetch("/api/admin/cohort-applications");

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/admin/login");
            return;
          }
          throw new Error("Failed to fetch cohort applications");
        }

        const json = await response.json();
        setData(json);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchCohortData();
  }, [router]);

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
            <h3 className="text-sm font-medium text-muted-foreground">Paid Seats</h3>
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
      <div className="rounded-md border border-border overflow-hidden">
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
                  
                  // Clean phone number for WA (strip chars like +, spaces, dashes if desired, 
                  // but WA often accepts standard formats cleanly if they start with county code)
                  const cleanPhone = app.phone.replace(/[^+\d]/g, '');

                  return (
                    <tr key={app.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                        {app.first_name} {app.last_name}
                      </td>
                      <td className="px-6 py-4 truncate max-w-[200px]">{app.email}</td>
                      <td className="px-6 py-4">{app.phone}</td>
                      <td className="px-6 py-4 capitalize">{app.current_role}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            isPaid
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }`}
                        >
                          {app.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 rounded border border-emerald-500/20 transition-colors"
                        >
                          Open WhatsApp
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
