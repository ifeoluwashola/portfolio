"use client";
import React, { useState } from 'react';
import { X, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { WaitlistUpsell } from "./WaitlistUpsell";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";
    try {
      const res = await fetch(`${apiBase}/v1/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          name,
          email,
          whatsapp_number: whatsappNumber,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-card border border-yellow-500/20 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 bg-yellow-500/5">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Cohort 2 Waitlist</span>
            </div>
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {success ? (
            <div className="py-6 space-y-4">
              <WaitlistUpsell email={email} />
              <button
                onClick={onClose}
                className="w-full py-4 border border-border hover:bg-muted text-foreground font-bold uppercase tracking-widest text-xs rounded-2xl transition-all"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Secure Your Spot</h3>
                <p className="text-xs text-muted-foreground">
                  Cohort 1 is fully in session. Join the waitlist for Cohort 2 to receive priority enrollment and early bird notifications.
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-500 font-semibold leading-relaxed">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] ml-1 flex">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-yellow-500/40 transition-all font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] ml-1 flex">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-yellow-500/40 transition-all font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] ml-1 flex">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+234..."
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-yellow-500/40 transition-all font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Securing Spot...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Join Cohort 2 Waitlist
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
