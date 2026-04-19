"use client";

import { useEffect, useState } from "react";
import { 
  getBillingOverview, 
  getBillingLedger, 
  logManualPayment 
} from "../../actions";
import { 
  CreditCard, 
  DollarSign, 
  Users, 
  AlertCircle, 
  Plus, 
  Search,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";

export default function AdminBillingPage() {
  const [overview, setOverview] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [manualAmount, setManualAmount] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [overviewRes, ledgerRes] = await Promise.all([
      getBillingOverview(),
      getBillingLedger()
    ]);

    if (overviewRes.data) setOverview(overviewRes.data);
    if (ledgerRes.data) setLedger(ledgerRes.data);
    setLoading(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !manualAmount) return;

    setFormLoading(true);
    const amountKobo = Math.round(parseFloat(manualAmount) * 100);
    const res = await logManualPayment(selectedStudent.id, amountKobo, manualNote);

    if (res.success) {
      await loadData();
      setIsModalOpen(false);
      setManualAmount("");
      setManualNote("");
    } else {
      alert("Failed to log payment: " + res.error);
    }
    setFormLoading(false);
  };

  const formatCurrency = (kobo: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(kobo / 100);
  };

  const filteredLedger = ledger.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid_in_full": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "good_standing": return "text-sky-400 bg-sky-400/10 border-sky-400/20";
      case "payment_locked": return "text-rose-400 bg-rose-400/10 border-rose-400/20";
      default: return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    }
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-slate-100 flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-primary" />
          Financial Command Center
        </h1>
        <p className="text-slate-400 mt-2">Real-time revenue monitoring and manual ledger overrides.</p>
      </header>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-primary/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Collected</span>
          </div>
          <p className="text-sm font-medium text-slate-400">Total Revenue Collected</p>
          <p className="text-3xl font-black text-white mt-1">{formatCurrency(overview?.total_revenue || 0)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-primary/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <CreditCard className="h-6 w-6 text-amber-400" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Expected</span>
          </div>
          <p className="text-sm font-medium text-slate-400">Pending Receivables</p>
          <p className="text-3xl font-black text-white mt-1">{formatCurrency(overview?.pending_receivables || 0)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-primary/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-500/10 rounded-xl">
              <AlertCircle className="h-6 w-6 text-rose-400" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Alert</span>
          </div>
          <p className="text-sm font-medium text-slate-400">Overdue Accounts (Locked)</p>
          <p className="text-3xl font-black text-rose-500 mt-1">{overview?.overdue_accounts || 0}</p>
        </div>
      </div>

      {/* Ledger Table Section */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Student Billing Ledger
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search student or email..."
              className="bg-slate-950 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-80 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 tracking-widest uppercase border-b border-slate-800">Student</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 tracking-widest uppercase border-b border-slate-800 text-right">Total Paid</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 tracking-widest uppercase border-b border-slate-800 text-right">Balance</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 tracking-widest uppercase border-b border-slate-800">Next Due</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 tracking-widest uppercase border-b border-slate-800">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 tracking-widest uppercase border-b border-slate-800 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredLedger.map((student) => (
                <tr key={student.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-200 group-hover:text-primary transition-colors">{student.first_name} {student.last_name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{student.email}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-emerald-400 font-bold">{formatCurrency(student.total_paid)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-mono font-bold ${student.remaining_balance > 0 ? "text-rose-400" : "text-sky-400"}`}>
                      {formatCurrency(student.remaining_balance)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-400">
                      {student.next_payment_due_date ? new Date(student.next_payment_due_date).toLocaleDateString() : "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full border tracking-tighter uppercase ${getStatusColor(student.billing_status)}`}>
                      {student.billing_status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => { setSelectedStudent(student); setIsModalOpen(true); }}
                      className="bg-slate-800 hover:bg-primary hover:text-primary-foreground text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ml-auto"
                    >
                      <Plus className="h-3 w-3" />
                      Manual Pay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">Log Manual Payment</h3>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Direct Bank Wire / Offline Transaction</p>
            </div>
            <form onSubmit={handleManualSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Student</p>
                  <p className="font-bold text-slate-200 mt-1">{selectedStudent?.first_name} {selectedStudent?.last_name}</p>
                  <p className="text-xs text-slate-400">{selectedStudent?.email}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Plus className="h-3 w-3" />
                    Amount in Naira (₦)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="e.g. 50000"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-500 italic">Remaining Balance: {formatCurrency(selectedStudent?.remaining_balance || 0)}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Search className="h-3 w-3" />
                    Reference / Note
                  </label>
                  <textarea 
                    placeholder="e.g. Wire transfer from Zenith Bank ref #123456"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] text-sm"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={formLoading}
                  className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
