"use client";
import React, { useState } from 'react';
import { X, Send, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';

interface AdminBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadsCount: number;
  onBroadcast: (subject: string, body: string) => Promise<{ success: boolean; error?: string }>;
}

export const AdminBroadcastModal: React.FC<AdminBroadcastModalProps> = ({ 
  isOpen, 
  onClose, 
  leadsCount, 
  onBroadcast 
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setError('Please provide a subject and body.');
      return;
    }
    setError('');
    setShowConfirm(true);
  };

  const handleConfirmSend = async () => {
    setSending(true);
    setError('');
    try {
      const res = await onBroadcast(subject, body);
      if (res.success) {
        setSuccess(true);
        setShowConfirm(false);
        setSubject('');
        setBody('');
      } else {
        setError(res.error || 'Failed to dispatch email broadcast.');
        setShowConfirm(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      setShowConfirm(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-card border border-yellow-500/20 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Email Broadcast Center</span>
            </div>
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {success ? (
            <div className="py-12 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 mx-auto text-yellow-500" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground uppercase tracking-tight">Broadcast Dispatched</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  The promotional email broadcast was successfully sent to all <strong>{leadsCount}</strong> waitlist subscribers.
                </p>
              </div>
              <button
                onClick={() => {
                  setSuccess(false);
                  onClose();
                }}
                className="mt-6 px-8 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold uppercase tracking-widest text-xs rounded-2xl transition-all"
              >
                Done
              </button>
            </div>
          ) : showConfirm ? (
            <div className="py-6 space-y-6">
              <div className="flex items-start gap-4 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-red-500 uppercase tracking-wide text-sm">Critical Confirmation Required</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You are about to broadcast this email to <strong>{leadsCount}</strong> waitlist leads. Once confirmed, this will immediately dispatch the emails. This action cannot be revoked.
                  </p>
                </div>
              </div>

              <div className="border border-border/60 rounded-2xl p-5 space-y-3 bg-background/50 font-mono text-xs max-h-[250px] overflow-y-auto">
                <div className="text-muted-foreground"><span className="text-foreground font-bold">Subject:</span> {subject}</div>
                <div className="w-full h-px bg-border/40" />
                <div className="text-muted-foreground whitespace-pre-wrap"><span className="text-foreground font-bold">Body:</span>{"\n"}{body}</div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={sending}
                  className="px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border border-border bg-background"
                >
                  Cancel & Edit
                </button>
                <button
                  onClick={handleConfirmSend}
                  disabled={sending}
                  className="px-8 py-3.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Confirm & Send Broadcast
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendRequest} className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Compose Announcement</h3>
                <p className="text-xs text-muted-foreground">
                  Draft a promotional email. This message will be sent to the <strong>{leadsCount}</strong> leads currently registered on the Cohort 2 waitlist.
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-500 font-semibold">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enrollment Opening for Kybern Academy Cohort 2"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-yellow-500/40 transition-all font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">
                    Email Body
                  </label>
                  <textarea
                    required
                    rows={8}
                    placeholder="Hi {{name}}, we are excited to announce that..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-yellow-500/40 transition-all font-semibold resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Review & Send Broadcast
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
