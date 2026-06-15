"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Code, Mail, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { KybernNexusNavbar } from "@/components/KybernNexusNavbar";
import { KybernNexusFooter } from "@/components/KybernNexusFooter";

export function LandingUI({ latestPosts }: { latestPosts: React.ReactNode }) {
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", company: "", role: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus("idle");
    setErrorMessage("");
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";
    try {
      const res = await fetch(`${apiBase}/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: formData.firstName, last_name: formData.lastName, email: formData.email, company: formData.company, role: formData.role, message: formData.message }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to submit"); }
      setFormStatus("success");
      setFormData({ firstName: "", lastName: "", email: "", company: "", role: "", message: "" });
    } catch (err: unknown) {
      setFormStatus("error");
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-kn-bg text-kn-body font-sans selection:bg-kn-accent/30 selection:text-kn-heading">
      {/* 1. Global Navbar */}
      <KybernNexusNavbar />

      {/* 2. Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-kn-bg pt-20">
        <div className="absolute inset-0 z-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80" alt="Hero Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-kn-bg" />
        </div>

        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto w-full">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-kn-accent/30 bg-kn-accent-bg text-kn-accent text-sm font-semibold tracking-wide uppercase">
            Cloud Engineering · DevOps Consulting · Technical Education
          </div>
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6 drop-shadow-2xl">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-kn-heading via-kn-heading to-kn-accent">
                We build the infrastructure modern businesses run on.
              </span>
            </h1>
            <p className="text-xl md:text-2xl font-medium text-kn-body max-w-3xl drop-shadow-lg leading-relaxed">
              From cloud cost audits to production-grade DevOps consulting, to the engineering education your team actually needs — Kybern Nexus is where serious engineering happens.
            </p>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/consulting" className="bg-kn-accent hover:brightness-110 text-kn-bg px-6 py-4 rounded-md text-base md:text-lg font-bold transition-all shadow-[0_0_20px_var(--kn-accent-glow)] flex items-center justify-center gap-2">
              Explore Consulting <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/academy" className="bg-kn-card hover:brightness-95 dark:hover:brightness-125 text-kn-heading border border-kn-border px-6 py-4 rounded-md text-base md:text-lg font-bold transition-all flex items-center justify-center">
              Browse the Academy <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2.5. Social Proof / Stats */}
      <section className="py-20 bg-kn-bg border-t border-kn-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-kn-accent/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-kn-heading">Trusted by engineering teams across industries.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-kn-card border border-kn-border p-8 rounded-2xl text-center shadow-lg hover:border-kn-accent/50 transition-colors">
              <p className="text-5xl font-black text-kn-accent mb-4">100+</p>
              <p className="text-lg font-bold text-kn-heading mb-2">Projects Deployed</p>
              <p className="text-sm text-kn-muted leading-relaxed">Across startups, scale-ups, and enterprise teams on AWS, GCP, and Azure.</p>
            </div>
            <div className="bg-kn-card border border-kn-border p-8 rounded-2xl text-center shadow-lg hover:border-kn-accent/50 transition-colors">
              <p className="text-5xl font-black text-kn-accent mb-4">45%</p>
              <p className="text-lg font-bold text-kn-heading mb-2">Cost Reduction</p>
              <p className="text-sm text-kn-muted leading-relaxed">Typical average result within 60 days of our first infrastructure audit.</p>
            </div>
            <div className="bg-kn-card border border-kn-border p-8 rounded-2xl text-center shadow-lg hover:border-kn-accent/50 transition-colors">
              <p className="text-5xl font-black text-kn-accent mb-4">50+</p>
              <p className="text-lg font-bold text-kn-heading mb-2">Engineers Trained</p>
              <p className="text-sm text-kn-muted leading-relaxed">Through the Kybern Academy — some on staff, others at client sites.</p>
            </div>
            <div className="bg-kn-card border border-kn-border p-8 rounded-2xl text-center shadow-lg hover:border-kn-accent/50 transition-colors">
              <p className="text-5xl font-black text-kn-accent mb-4">3</p>
              <p className="text-lg font-bold text-kn-heading mb-2">Cloud Platforms</p>
              <p className="text-sm text-kn-muted leading-relaxed">AWS &middot; GCP &middot; Azure. Active production experience on all three.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Services & Products (Ecosystem) */}
      <section id="ecosystem" className="py-24 bg-kn-bg relative border-t border-kn-border">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-kn-accent/30 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-kn-accent font-bold tracking-widest uppercase text-sm mb-2">WHAT WE DO</h2>
            <p className="text-3xl md:text-5xl font-extrabold text-kn-heading">Four ways to work with us. One standard of engineering.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-kn-card border border-kn-border rounded-xl overflow-hidden hover:border-kn-accent/50 transition-all group shadow-xl">
              <div className="aspect-video relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80" alt="Consulting" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-kn-card to-transparent" />
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-kn-heading mb-3">Software &amp; Cloud Consulting</h3>
                <p className="text-kn-muted mb-6 leading-relaxed">
                  We audit, redesign, and automate infrastructure for engineering teams who need to move faster and spend smarter. Senior-led. Outcome-focused.
                </p>
                <Link href="/consulting#contact" className="text-kn-accent font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                  Consult With Us <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-kn-card border border-kn-border rounded-xl overflow-hidden hover:border-kn-accent/50 transition-all group shadow-xl">
              <div className="aspect-video relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80" alt="Academy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-kn-card to-transparent" />
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-kn-heading mb-3">Kybern Academy</h3>
                <p className="text-kn-muted mb-6 leading-relaxed">
                  Production-grade cloud engineering training built around real systems — not toy examples. For engineers who want to go from knowing the theory to running it in production.
                </p>
                <Link href="/academy" className="text-kn-accent font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                  Enter the Academy <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-kn-card border border-kn-border rounded-xl overflow-hidden hover:border-kn-accent/50 transition-all group shadow-xl">
              <div className="aspect-video relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80" alt="Staff Augmentation" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-kn-card to-transparent" />
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-kn-heading mb-3">Staff Augmentation</h3>
                <p className="text-kn-muted mb-6 leading-relaxed">
                  Embed pre-vetted cloud engineers trained specifically on enterprise infrastructure via the Kybern Academy directly into your daily operations.
                </p>
                <Link href="/consulting#contact" className="text-kn-accent font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                  Request Talent <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-kn-card border border-kn-border rounded-xl overflow-hidden hover:border-kn-accent/50 transition-all group shadow-xl">
              <div className="aspect-video relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80" alt="IoT" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-kn-card to-transparent" />
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-kn-heading mb-3">IoT &amp; Smart Devices</h3>
                <p className="text-kn-muted mb-6 leading-relaxed">
                  Bridging the physical and digital. Custom smart device engineering and embedded systems.
                </p>
                <span className="text-kn-faded font-semibold flex items-center gap-2 cursor-not-allowed">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. About Us */}
      <section id="about" className="py-24 bg-kn-card border-t border-kn-border relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-kn-accent font-bold tracking-widest uppercase text-sm mb-2">HOW WE WORK</h2>
              <h3 className="text-3xl md:text-5xl font-extrabold text-kn-heading mb-6">We close the gap between knowing and doing.</h3>
              <p className="text-lg text-kn-body leading-relaxed mb-8">
                Whether we're redesigning your cloud architecture or training your next senior engineer, the standard is the same: production-grade, documented, and built to last.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12 mb-8">
                {[
                  { title: "Built to Fail Safely", desc: "Systems we build expect failure. Resilience isn't an afterthought — it's in the architecture from day one." },
                  { title: "Engineered for Growth", desc: "We design for where you're going, not just where you are. Architectures that scale from your current stage to the next." },
                  { title: "Relentless Automation", desc: "Manual processes are technical debt in disguise. We eliminate toil and replace it with reliable, repeatable automation." },
                  { title: "Full Transparency", desc: "You always know what we built and why. Every system comes with documentation your team can actually use." },
                ].map((value, i) => (
                  <div key={i} className="bg-kn-bg p-6 rounded-xl border border-kn-border shadow-lg">
                    <CheckCircle className="w-6 h-6 text-kn-accent mb-4" />
                    <h4 className="text-kn-heading font-bold mb-2">{value.title}</h4>
                    <p className="text-sm text-kn-muted">{value.desc}</p>
                  </div>
                ))}
              </div>
              <Link href="/about" className="text-kn-accent font-bold flex items-center gap-2 hover:gap-3 transition-all mt-4">
                Read our full story <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-kn-accent/20 to-transparent rounded-2xl transform translate-x-4 translate-y-4" />
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" 
                alt="Engineering Team" 
                className="relative rounded-2xl shadow-2xl border border-kn-border z-10 w-full object-cover aspect-[4/5]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4.5. Latest Posts (Blog) */}
      {latestPosts}

      {/* 5. Contact Form */}
      <section id="contact" className="py-24 bg-kn-bg border-t border-kn-border relative overflow-hidden">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-kn-accent/20 to-transparent opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-kn-accent font-bold tracking-widest uppercase text-sm mb-2">Get In Touch</h2>
            <p className="text-3xl md:text-5xl font-extrabold text-kn-heading">Have a project? Let&apos;s talk.</p>
            <p className="mt-4 text-lg leading-8 text-kn-muted">
              Tell us what you&apos;re building — or what&apos;s broken — and we&apos;ll come back with a clear perspective on how to help.
            </p>
          </div>

          <div className="mx-auto max-w-xl lg:max-w-2xl">
            <div className="bg-kn-card border border-kn-border rounded-2xl p-8 sm:p-10 shadow-xl">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="contact-firstName" className="text-kn-heading text-sm font-medium">First Name</label>
                    <input id="contact-firstName" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="Jane" className="w-full bg-kn-bg border border-kn-border rounded-lg px-4 py-3 text-kn-heading placeholder:text-kn-faded focus:outline-none focus:ring-2 focus:ring-kn-accent/50 focus:border-kn-accent/50 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contact-lastName" className="text-kn-heading text-sm font-medium">Last Name</label>
                    <input id="contact-lastName" name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Doe" className="w-full bg-kn-bg border border-kn-border rounded-lg px-4 py-3 text-kn-heading placeholder:text-kn-faded focus:outline-none focus:ring-2 focus:ring-kn-accent/50 focus:border-kn-accent/50 transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="contact-email" className="text-kn-heading text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-kn-faded" />
                    <input id="contact-email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="jane@example.com" className="w-full bg-kn-bg border border-kn-border rounded-lg pl-10 pr-4 py-3 text-kn-heading placeholder:text-kn-faded focus:outline-none focus:ring-2 focus:ring-kn-accent/50 focus:border-kn-accent/50 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="contact-company" className="text-kn-heading text-sm font-medium">Company</label>
                    <input id="contact-company" name="company" value={formData.company} onChange={handleChange} placeholder="Acme Corp" className="w-full bg-kn-bg border border-kn-border rounded-lg px-4 py-3 text-kn-heading placeholder:text-kn-faded focus:outline-none focus:ring-2 focus:ring-kn-accent/50 focus:border-kn-accent/50 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contact-role" className="text-kn-heading text-sm font-medium">Your Role</label>
                    <input id="contact-role" name="role" value={formData.role} onChange={handleChange} placeholder="CTO, Founder, etc." className="w-full bg-kn-bg border border-kn-border rounded-lg px-4 py-3 text-kn-heading placeholder:text-kn-faded focus:outline-none focus:ring-2 focus:ring-kn-accent/50 focus:border-kn-accent/50 transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="contact-message" className="text-kn-heading text-sm font-medium">What&apos;s your biggest infrastructure challenge right now?</label>
                  <textarea id="contact-message" name="message" value={formData.message} onChange={handleChange} required placeholder="Tell us about your project or challenge..." rows={5} className="w-full bg-kn-bg border border-kn-border rounded-lg px-4 py-3 text-kn-heading placeholder:text-kn-faded focus:outline-none focus:ring-2 focus:ring-kn-accent/50 focus:border-kn-accent/50 transition-all resize-y" />
                </div>

                {formStatus === "success" && (
                  <div className="p-3 bg-kn-accent-bg border border-kn-accent/30 rounded-lg flex items-center gap-2 text-kn-accent">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Message sent successfully! We&apos;ll be in touch soon.</span>
                  </div>
                )}

                {formStatus === "error" && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="w-full bg-kn-accent hover:brightness-110 text-kn-bg font-bold py-4 text-lg rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_var(--kn-accent-glow)] hover:shadow-[0_0_30px_var(--kn-accent-glow)] disabled:opacity-70 disabled:cursor-not-allowed">
                  <Send className="w-5 h-5" />
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
                <p className="text-center text-sm font-medium text-kn-muted pt-2">
                  We reply within one business day.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Global Footer */}
      <KybernNexusFooter />
    </div>
  );
}
