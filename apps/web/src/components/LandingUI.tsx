"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Code, Mail, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { KybernNexusNavbar } from "@/components/KybernNexusNavbar";
import { KybernNexusFooter } from "@/components/KybernNexusFooter";

export function LandingUI({ latestPosts }: { latestPosts: React.ReactNode }) {
  const [currentSlide, setCurrentSlide] = useState(0);
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
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api";
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

  const slides = [
    {
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80",
      title: "Kybern Nexus",
      subtitle: "Your Central Hub for Technological Innovation.",
    },
    {
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
      title: "Engineering Reality",
      subtitle: "From Smart Devices to Global Systems.",
    },
    {
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
      title: "Forging Elite Talent",
      subtitle: "Enter the Live Ops Bridge.",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="min-h-screen bg-kn-bg text-kn-body font-sans selection:bg-kn-accent/30 selection:text-kn-heading">
      {/* 1. Global Navbar */}
      <KybernNexusNavbar />

      {/* 2. Interactive Hero Slider */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-kn-bg">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-[var(--kn-overlay)] z-10" />
            <img
              src={slide.image}
              alt="Hero Background"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ))}

        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto mt-20 w-full">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-kn-accent/30 bg-kn-accent-bg text-kn-accent text-sm font-semibold tracking-wide uppercase">
            Kybern Nexus Ltd
          </div>
          <div className="h-48 md:h-64 flex items-center justify-center relative w-full">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute w-full left-0 text-center flex flex-col items-center justify-center transition-all duration-[1500ms] ease-out ${
                  index === currentSlide ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12 pointer-events-none"
                }`}
              >
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-kn-heading leading-tight tracking-tight mb-4 drop-shadow-2xl">
                  {slide.title}
                </h1>
                <p className="text-xl md:text-2xl lg:text-3xl font-medium text-kn-body max-w-3xl drop-shadow-lg">
                  {slide.subtitle}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/consulting" className="bg-kn-accent hover:brightness-110 text-kn-bg px-5 py-3 md:px-8 md:py-4 rounded-md text-sm md:text-lg font-bold transition-all shadow-[0_0_20px_var(--kn-accent-glow)] flex items-center gap-2">
              Explore Consulting <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
            <Link href="/academy" className="bg-kn-card hover:brightness-95 dark:hover:brightness-125 text-kn-heading border border-kn-border px-5 py-3 md:px-8 md:py-4 rounded-md text-sm md:text-lg font-bold transition-all">
              Join Academy
            </Link>
          </div>
        </div>

        {/* Slider Navigation Dots */}
        <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? "bg-kn-accent w-8" : "bg-kn-heading/30 hover:bg-kn-heading/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 3. Services & Products (Ecosystem) */}
      <section id="ecosystem" className="py-24 bg-kn-bg relative border-t border-kn-border">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-kn-accent/30 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-kn-accent font-bold tracking-widest uppercase text-sm mb-2">Our Ecosystem</h2>
            <p className="text-3xl md:text-5xl font-extrabold text-kn-heading">Engineering Reality.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-kn-card border border-kn-border rounded-xl overflow-hidden hover:border-kn-accent/50 transition-all group shadow-xl">
              <div className="aspect-video relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80" alt="Consulting" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-kn-card to-transparent" />
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-kn-heading mb-3">Software &amp; IT Consultancy</h3>
                <p className="text-kn-muted mb-6 leading-relaxed">
                  Architecting resilient, scalable enterprise software and cloud-native infrastructure.
                </p>
                <Link href="/consulting" className="text-kn-accent font-semibold flex items-center gap-2 hover:gap-3 transition-all">
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
                  Forging the next generation of Cloud Engineers through rigorous, production-grade simulations.
                </p>
                <Link href="/academy" className="text-kn-accent font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                  Enter the Academy <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Card 3 */}
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
              <h2 className="text-kn-accent font-bold tracking-widest uppercase text-sm mb-2">Vision &amp; Mission</h2>
              <h3 className="text-3xl md:text-5xl font-extrabold text-kn-heading mb-6">Engineering Reality.</h3>
              <p className="text-lg text-kn-body leading-relaxed mb-8">
                To bridge the gap between theoretical knowledge and production-grade engineering, while building the infrastructure that powers modern business.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
                {[
                  { title: "Radical Reliability", desc: "Systems that do not fail when it matters." },
                  { title: "Build to Scale", desc: "Architectures designed for tomorrow's growth." },
                  { title: "Continuous Mastery", desc: "Relentless pursuit of engineering excellence." },
                  { title: "System Transparency", desc: "Clear, observable, and measurable operations." },
                ].map((value, i) => (
                  <div key={i} className="bg-kn-bg p-6 rounded-xl border border-kn-border shadow-lg">
                    <CheckCircle className="w-6 h-6 text-kn-accent mb-4" />
                    <h4 className="text-kn-heading font-bold mb-2">{value.title}</h4>
                    <p className="text-sm text-kn-muted">{value.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-kn-accent/20 to-transparent rounded-2xl transform translate-x-4 translate-y-4" />
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" 
                alt="Engineering Team" 
                className="relative rounded-2xl shadow-2xl border border-kn-border z-10 w-full object-cover aspect-[4/5]"
              />
              <div className="absolute -bottom-8 -left-8 bg-kn-bg p-6 rounded-xl border border-kn-border shadow-xl z-20 flex items-center gap-4">
                <div className="w-12 h-12 bg-kn-accent-bg rounded-full flex items-center justify-center">
                  <Code className="text-kn-accent w-6 h-6" />
                </div>
                <div>
                  <p className="text-kn-heading font-bold">100+ Projects</p>
                  <p className="text-sm text-kn-muted">Successfully Deployed</p>
                </div>
              </div>
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
            <p className="text-3xl md:text-5xl font-extrabold text-kn-heading">Let&apos;s Build Together</p>
            <p className="mt-4 text-lg leading-8 text-kn-muted">
              Have a project in mind or need expert consultation? Send us a message and we&apos;ll get back to you promptly.
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
                    <label htmlFor="contact-role" className="text-kn-heading text-sm font-medium">Role / Position</label>
                    <input id="contact-role" name="role" value={formData.role} onChange={handleChange} placeholder="CTO, Founder, etc." className="w-full bg-kn-bg border border-kn-border rounded-lg px-4 py-3 text-kn-heading placeholder:text-kn-faded focus:outline-none focus:ring-2 focus:ring-kn-accent/50 focus:border-kn-accent/50 transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="contact-message" className="text-kn-heading text-sm font-medium">How can we help you?</label>
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
