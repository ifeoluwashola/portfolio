"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send, CheckCircle2, AlertCircle } from "lucide-react";

export function ContactSection() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api"}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          company: formData.company,
          message: formData.message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit request");
      }

      setStatus("success");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        message: ""
      });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <section id="contact" className="py-24 sm:py-32 bg-background border-t border-border relative overflow-hidden">
      {/* Background glow for contact section */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#10b981] to-[#0ea5e9] opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Let&apos;s Optimize Your Cloud ROI
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Whether you need a comprehensive infrastructure audit or wish to harden your deployment pipelines, I&apos;m ready to help you scale securely.
          </p>
        </div>

        <div className="mx-auto max-w-xl lg:max-w-2xl">
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 sm:p-10 shadow-lg relative h-full">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                  <Input id="firstName" value={formData.firstName} onChange={handleChange} required placeholder="Jane" className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                  <Input id="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Doe" className="bg-background border-border" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={formData.email} onChange={handleChange} required placeholder="jane@example.com" className="pl-10 bg-background border-border" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-foreground">Company</Label>
                <Input id="company" value={formData.company} onChange={handleChange} placeholder="Acme Corp" className="bg-background border-border" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-foreground">How can I help you?</Label>
                <Textarea 
                  id="message" 
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Tell me about your infrastructure challenges..." 
                  className="min-h-[150px] bg-background border-border resize-y" 
                />
              </div>

              {status === "success" && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Consultation requested successfully!</span>
                </div>
              )}

              {status === "error" && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-6 text-lg rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
                <Send className="w-5 h-5" />
                {isSubmitting ? "Sending..." : "Book Consultation"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
