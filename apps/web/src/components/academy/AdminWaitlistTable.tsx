"use client";
import React, { useState } from 'react';
import { Search, Mail, Calendar, Phone, User, Inbox } from 'lucide-react';

interface WaitlistLead {
  id: string;
  name: string;
  email: string;
  whatsapp_number: string;
  joined_at: string;
}

interface AdminWaitlistTableProps {
  leads: WaitlistLead[];
  onOpenBroadcast: () => void;
}

export const AdminWaitlistTable: React.FC<AdminWaitlistTableProps> = ({ leads, onOpenBroadcast }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.whatsapp_number.includes(searchTerm)
  );

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-yellow-500 transition-colors" />
          <input
            type="text"
            placeholder="Filter waitlist leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background border border-border rounded-2xl pl-12 pr-4 py-3.5 text-xs text-foreground focus:outline-none focus:border-yellow-500/40 transition-all font-semibold"
          />
        </div>

        <button
          onClick={onOpenBroadcast}
          disabled={leads.length === 0}
          className="px-6 py-3.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:hover:bg-yellow-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2"
        >
          <Mail className="w-4 h-4" />
          Broadcast to Waitlist ({leads.length})
        </button>
      </div>

      {/* Table container */}
      <div className="overflow-x-auto border border-border/60 rounded-2xl bg-background/30">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/80 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 bg-muted/20">
              <th className="py-4 px-6">Name</th>
              <th className="py-4 px-6">Contact Info</th>
              <th className="py-4 px-6">WhatsApp</th>
              <th className="py-4 px-6">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-xs">
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <tr 
                  key={lead.id} 
                  className="hover:bg-muted/10 transition-colors group"
                >
                  <td className="py-5 px-6 font-bold text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 font-mono">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span>{lead.name}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 font-mono text-muted-foreground group-hover:text-yellow-500 transition-colors">
                    <a href={`mailto:${lead.email}`} className="hover:underline flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-muted-foreground/40" />
                      {lead.email}
                    </a>
                  </td>
                  <td className="py-5 px-6 font-mono text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-muted-foreground/40" />
                      {lead.whatsapp_number}
                    </span>
                  </td>
                  <td className="py-5 px-6 font-mono text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-muted-foreground/40" />
                      {formatDate(lead.joined_at)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-16 text-center text-muted-foreground/60 uppercase font-black tracking-widest text-[10px]">
                  <div className="flex flex-col items-center gap-4">
                    <Inbox className="w-12 h-12 text-muted-foreground/30" />
                    <span>No waitlist leads found</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
