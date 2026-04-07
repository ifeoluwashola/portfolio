"use client";

import { useRegistrationPhase } from "@/hooks/useRegistrationPhase";
import { useState } from "react";
import { AlertCircle, Terminal, CheckCircle } from "lucide-react";

export function AcademyRegistrationForm() {
  const { phase, isMounted } = useRegistrationPhase();
  const [agreed, setAgreed] = useState(false);
  const [emailWaitlist, setEmailWaitlist] = useState("");
  const [submittedWaitlist, setSubmittedWaitlist] = useState(false);
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [otherRole, setOtherRole] = useState("");
  const [goal, setGoal] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isMounted) return null;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const finalRole = role === "other" ? otherRole : role;
    if (!firstName || !lastName || !email || !phone || !finalRole || !goal || !agreed) {
      setErrorMsg("Please complete all required fields and accept the Code of Conduct.");
      return;
    }

    setIsSubmitting(true);
    try {
      // NEXT_PUBLIC_API_URL should point to Go backend, e.g. http://localhost:8080/api/v1
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api";
      const API_URL = `${apiBase}/v1`;
      const response = await fetch(`${API_URL}/academy/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          current_role: finalRole,
          goal,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to initialize payment");
      }

      // Redirect securely to Paystack Checkout URL
      window.location.href = data.authorization_url;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message || "An unexpected error occurred.");
      } else {
        setErrorMsg("An unexpected error occurred.");
      }
      setIsSubmitting(false);
    }
  };

  if (phase === "closed") {
    return (
      <div className="bg-card w-full max-w-2xl mx-auto rounded-3xl p-8 border border-border mt-12 mb-24 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/50 to-orange-500/50" />
        <h3 className="text-2xl font-bold text-foreground mb-4">Cohort 1 is Full</h3>
        <p className="text-muted-foreground mb-8">
          We limit our cohorts to ensure high-quality mentorship. Join the waitlist to get priority access when Cohort 2 opens.
        </p>

        {submittedWaitlist ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 flex items-center text-yellow-400">
            <CheckCircle className="w-6 h-6 mr-3" />
            <span className="font-medium">You are on the list. Keep an eye on your inbox.</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={emailWaitlist}
              onChange={(e) => setEmailWaitlist(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-mono text-sm"
            />
            <button
              onClick={() => setSubmittedWaitlist(true)}
              disabled={!emailWaitlist}
              className="bg-red-500 text-white font-semibold py-3 px-8 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Join Waitlist
            </button>
          </div>
        )}
      </div>
    );
  }

  // Pre-Launch and Open States render the form
  return (
    <div id="registration-form" className="w-full max-w-3xl mx-auto mt-12 mb-24 scroll-mt-24">
      {/* Zero Tolerance Warning */}
      <div className="bg-amber-500/5 border border-amber-500/40 rounded-2xl p-6 sm:p-8 mb-10 shadow-[0_0_30px_rgba(234,179,8,0.05)]">
        <div className="flex items-center gap-3 text-amber-500 mb-6 font-bold text-xl uppercase tracking-wider">
          <AlertCircle className="w-6 h-6" />
          Zero-Tolerance Code of Conduct
        </div>
        <p className="font-semibold text-foreground mb-6">
          This is a bootcamp, not a subscription. The following rules are strictly enforced:
        </p>
        <ul className="space-y-4 text-muted-foreground mb-6">
          <li className="flex gap-3 items-start">
             <span className="text-amber-400 font-bold mt-0.5">•</span>
             <span><strong>Attendance:</strong> Missing 3 live classes results in immediate disqualification.</span>
          </li>
          <li className="flex gap-3 items-start">
             <span className="text-amber-400 font-bold mt-0.5">•</span>
             <span><strong>Punctuality:</strong> The room locks at 9:10 PM. If you are 10 minutes late, you cannot join the session.</span>
          </li>
          <li className="flex gap-3 items-start">
             <span className="text-amber-400 font-bold mt-0.5">•</span>
             <span><strong>Execution:</strong> Failing to submit 3 weekly assignments results in disqualification.</span>
          </li>
          <li className="flex gap-3 items-start">
             <span className="text-amber-400 font-bold mt-0.5">•</span>
             <span><strong>Integrity:</strong> If you submit code (even AI-assisted) that you cannot verbally explain, you fail the assignment.</span>
          </li>
        </ul>
        <div className="bg-amber-500/10 text-amber-400 p-4 rounded-xl text-sm font-semibold border border-amber-500/20">
          Note: Disqualification results in immediate removal and forfeiture of the commitment fee.
        </div>
      </div>

      <div className="bg-card rounded-3xl p-6 sm:p-10 border border-yellow-500/20 shadow-[0_0_50px_rgba(234,179,8,0.05)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-sky-500" />
        
        <h2 className="text-2xl font-bold mb-8 flex items-center">
          <Terminal className="w-6 h-6 mr-3 text-yellow-400" />
          Cohort 1 Application
        </h2>

        <form className="space-y-6" onSubmit={handleApply}>
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-sm font-medium">
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">First Name</label>
              <input required type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all text-sm" placeholder="John" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Last Name</label>
              <input required type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all text-sm" placeholder="Doe" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email Address</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all font-mono text-sm" placeholder="john@example.com" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone Number (WhatsApp)</label>
              <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all font-mono text-sm" placeholder="+234 800 000 0000" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Current Role</label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all text-sm text-foreground"
            >
              <option value="" disabled>Select your current status...</option>
              <option value="student">Student / Recent Grad</option>
              <option value="frontend">Frontend Developer</option>
              <option value="backend">Backend Developer</option>
              <option value="sysadmin">System Administrator</option>
              <option value="other">Other</option>
            </select>
            {role === "other" && (
              <input 
                type="text" 
                value={otherRole}
                onChange={(e) => setOtherRole(e.target.value)}
                placeholder="Please specify your role..." 
                className="w-full mt-3 bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all text-sm" 
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">What is your primary goal for this cohort?</label>
            <textarea required value={goal} onChange={(e) => setGoal(e.target.value)} rows={4} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all text-sm resize-none" placeholder="I want to learn how to deploy scalable apps..." />
          </div>

          <div className="pt-4 pb-2 border-t border-border mt-8">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-1">
                <input
                  type="checkbox"
                  className="w-5 h-5 appearance-none border-2 border-border rounded bg-background checked:bg-yellow-500 checked:border-yellow-500 transition-colors cursor-pointer"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                {agreed && <CheckCircle className="absolute w-4 h-4 text-white pointer-events-none" strokeWidth={3} />}
              </div>
              <span className="text-sm text-foreground leading-relaxed">
                I have read and agree to the <strong className="text-amber-400">Zero-Tolerance Code of Conduct</strong>. I understand that violating these rules will result in my disqualification without a refund.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!agreed || phase === "pre-launch" || isSubmitting}
            className={`w-full flex items-center justify-center py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
              phase === "pre-launch"
                ? "bg-secondary text-muted-foreground border border-border cursor-not-allowed"
                : agreed && !isSubmitting
                  ? "bg-yellow-500 text-black hover:bg-yellow-400 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] shadow-[0_0_10px_rgba(234,179,8,0.2)] transform active:scale-[0.99]" 
                  : "bg-secondary text-muted-foreground border border-border cursor-not-allowed opacity-70"
            }`}
          >
            {phase === "pre-launch" ? "Registration Opens April 2" : isSubmitting ? "Processing..." : "Proceed to Payment (₦10,000)"}
          </button>
        </form>
      </div>
    </div>
  );
}
