"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Calendar, Mail, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContactLead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  message: string;
  created_at: string;
}

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export default function AdminContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const idStr = resolvedParams.id;
  
  const [contact, setContact] = useState<ContactLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchContact() {
      try {
        const token = getCookie("auth_token");
        if (!token) {
          router.push("/admin/login");
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api"}/contacts/${idStr}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!res.ok) {
          if (res.status === 401) {
             router.push("/admin/login");
             return;
          }
          if (res.status === 404) {
             throw new Error("Consultation request not found");
          }
          throw new Error("Failed to fetch contact details");
        }

        const data = await res.json();
        setContact(data);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchContact();
  }, [idStr, router]);

  if (loading) return <div className="text-muted-foreground animate-pulse">Loading detailed view...</div>;
  if (error) return (
    <div className="space-y-4">
      <div className="text-red-500 bg-red-500/10 p-4 border border-red-500/20 rounded-md">Error: {error}</div>
      <Link href="/admin/contacts" className="text-sky-500 hover:underline inline-flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Requests
      </Link>
    </div>
  );
  if (!contact) return <div className="text-muted-foreground">Request not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/contacts" className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Consultation Request #{contact.id}</h1>
          <p className="text-muted-foreground text-sm">Full details for inquiry submitted by {contact.first_name}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left Sidebar Info */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Sender Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-semibold tracking-wider">
                  <User className="w-3.5 h-3.5" /> Full Name
                </div>
                <div className="font-medium">{contact.first_name} {contact.last_name}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-semibold tracking-wider">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </div>
                <a href={`mailto:${contact.email}`} className="font-medium text-sky-500 hover:underline block truncate" title={contact.email}>
                  {contact.email}
                </a>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-semibold tracking-wider">
                  <Building2 className="w-3.5 h-3.5" /> Company
                </div>
                <div className="font-medium">{contact.company || "Not Provided"}</div>
              </div>

              <div className="space-y-1 pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-semibold tracking-wider">
                  <Calendar className="w-3.5 h-3.5" /> Received On
                </div>
                <div className="font-medium text-sm">
                  {new Date(contact.created_at).toLocaleString(undefined, {
                    dateStyle: "full",
                    timeStyle: "short"
                  })}
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Main Content */}
        <div className="md:col-span-2">
          <Card className="h-full border-sky-500/20 bg-sky-500/5 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg border-b border-sky-500/20 pb-4">Client Message Request</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="text-base leading-relaxed whitespace-pre-wrap break-words">
                  {contact.message}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
