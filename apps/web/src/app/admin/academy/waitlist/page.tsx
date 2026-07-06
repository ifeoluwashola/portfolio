"use client";
import React, { useEffect, useState } from 'react';
import { getWaitlist, broadcastWaitlist } from '../../actions';
import { AdminWaitlistTable } from '@/components/academy/AdminWaitlistTable';
import { AdminBroadcastModal } from '@/components/academy/AdminBroadcastModal';
import { Users, Loader2 } from 'lucide-react';

interface WaitlistLead {
  id: string;
  name: string;
  email: string;
  whatsapp_number: string;
  joined_at: string;
  deposit_paid: boolean;
  total_amount_paid: number;
}

export default function AdminWaitlistPage() {
  const [leads, setLeads] = useState<WaitlistLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  const fetchLeads = async () => {
    try {
      const res = await getWaitlist(200, 0); // Fetch up to 200 leads
      if (res.error) {
        setError(res.error);
      } else if (res.data && Array.isArray(res.data.leads)) {
        setLeads(res.data.leads);
      }
    } catch (err) {
      setError('Failed to fetch waitlist leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleBroadcastDispatch = async (subject: string, body: string) => {
    try {
      const res = await broadcastWaitlist(subject, body);
      if (res.success) {
        return { success: true };
      } else {
        return { success: false, error: res.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network request failed' };
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-yellow-500 uppercase tracking-widest">
            <Users className="w-3.5 h-3.5" />
            CRM Lead Management
          </div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Waitlist Capture Hub</h1>
          <p className="text-xs text-muted-foreground">
            Monitor registration leads for Kybern Academy Cohort 2 and dispatch bulk promotional emails.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          <span className="text-[10px] font-black uppercase tracking-widest">Accessing waitlist archives...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-sm text-red-500 leading-relaxed font-semibold">
          Error: {error}
        </div>
      ) : (
        <AdminWaitlistTable 
          leads={leads} 
          onOpenBroadcast={() => setIsBroadcastOpen(true)} 
        />
      )}

      {/* Broadcast Composer Modal */}
      <AdminBroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        leadsCount={leads.length}
        onBroadcast={handleBroadcastDispatch}
      />
    </div>
  );
}
