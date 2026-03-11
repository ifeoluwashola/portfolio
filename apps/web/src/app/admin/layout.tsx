"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ModeToggle } from "@/components/ModeToggle";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/register";

  if (isAuthPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    // Optionally call backend logout endpoint if needed
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api"}/admin/logout`, {
        method: "POST",
      });
    } catch (e) {
      console.error(e);
    }
    
    // Clear the auth cookie on the client side
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    // Redirect to homepage
    router.push("/");
    router.refresh();
  };

  const navLinks = [
    { href: "/admin/profile", label: "Profile & Bio" },
    { href: "/admin/contacts", label: "Consultation Requests" },
    { href: "/admin/projects", label: "Manage Projects" },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <span className="text-primary">⌘</span> Admin
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                pathname === link.href 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border flex items-center justify-between">
          <button 
            onClick={handleLogout}
            className="text-sm font-medium text-destructive hover:underline"
          >
            Sign Out
          </button>
          <ModeToggle />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
