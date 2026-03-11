"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ContactLead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  message: string;
  created_at: string;
}

// Helper to get cookie value
function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchContacts() {
      try {
        const token = getCookie("auth_token");
        if (!token) {
          router.push("/admin/login");
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api"}/contacts`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!res.ok) {
          if (res.status === 401) {
             router.push("/admin/login");
             return;
          }
          throw new Error("Failed to fetch contacts");
        }

        const data = await res.json();
        setContacts(data || []);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchContacts();
  }, [router]);

  if (loading) return <div className="text-muted-foreground animate-pulse">Loading leads...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Consultation Requests</h1>
      <p className="text-muted-foreground mb-8">Review leads captured from the external portfolio site.</p>

      <div className="rounded-md border border-border">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground text-xs uppercase border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Company</th>
              <th className="px-6 py-4 font-medium">Message</th>
              <th className="px-6 py-4 font-medium max-w-[150px]">Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  No consultation requests found.
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{contact.first_name} {contact.last_name}</td>
                  <td className="px-6 py-4">{contact.email}</td>
                  <td className="px-6 py-4">{contact.company || "-"}</td>
                  <td className="px-6 py-4 max-w-xs truncate" title={contact.message}>{contact.message}</td>
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/contacts/${contact.id}`} className="text-sky-500 hover:text-sky-600 font-medium text-sm">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
