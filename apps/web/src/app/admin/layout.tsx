"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/ModeToggle";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Menu, ChevronDown, GraduationCap, Users, BookOpen, Send, Terminal, Settings, LogOut, Activity } from "lucide-react";
import { adminLogout } from "./actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [academyOpen, setAcademyOpen] = useState(pathname.includes("/admin/academy") || pathname === "/admin/cohort");

  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/change-password";

  if (isAuthPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await adminLogout();
  };

  const navLinks = [
    { href: "/admin/profile", label: "Profile & Bio", icon: <Users className="h-4 w-4" /> },
    { href: "/admin/contacts", label: "Consultation Requests", icon: <Send className="h-4 w-4" /> },
    { href: "/admin/projects", label: "Manage Projects", icon: <BookOpen className="h-4 w-4" /> },
    { href: "/admin/blogs", label: "Blog Analytics", icon: <BookOpen className="h-4 w-4" /> },
    { href: "/admin/monitoring", label: "Monitoring", icon: <Activity className="h-4 w-4" /> },
    { href: "/admin/invite", label: "Invite Admin", icon: <Settings className="h-4 w-4" /> },
  ];

  const academyLinks = [
    { href: "/admin/cohort", label: "Applications", icon: <Users className="h-4 w-4" /> },
    { href: "/admin/academy/waitlist", label: "Waitlist Capture", icon: <Users className="h-4 w-4" /> },
    { href: "/admin/academy/billing", label: "Billing & Revenue", icon: <GraduationCap className="h-4 w-4" /> },
    { href: "/admin/academy/students", label: "Student Management", icon: <Users className="h-4 w-4" /> },
    { href: "/admin/academy/curriculum", label: "Curriculum", icon: <BookOpen className="h-4 w-4" /> },
    { href: "/admin/academy/submissions", label: "Submissions", icon: <GraduationCap className="h-4 w-4" /> },
    { href: "/admin/academy/break-it-labs", label: "Break-It Labs", icon: <Terminal className="h-4 w-4" /> },
    { href: "/admin/academy/graduations", label: "Graduation PR Queue", icon: <GraduationCap className="h-4 w-4" /> },
    { href: "/admin/academy/alumni", label: "Alumni Manager", icon: <Users className="h-4 w-4" /> },
  ];

  const NavItem = ({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) => (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
        pathname === href 
          ? "bg-primary text-primary-foreground font-medium shadow-sm" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <Link href="/" className="text-xl font-bold flex items-center gap-2">
          <span className="text-primary text-2xl">⌘</span>
          <span className="tracking-tight">Kybern Admin</span>
        </Link>
        <Sheet>
          <SheetTrigger className="p-2 -mr-2 text-foreground">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle admin menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 flex flex-col bg-card border-r border-border">
            <VisuallyHidden>
              <SheetTitle>Admin Layout Menu</SheetTitle>
              <SheetDescription>Mobile navigation for admin pages</SheetDescription>
            </VisuallyHidden>
            <div className="p-6 border-b border-border">
              <Link href="/" className="text-xl font-bold flex items-center gap-2">
                <span className="text-primary">⌘</span> Admin
              </Link>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {navLinks.map((link) => (
                <NavItem key={link.href} {...link} />
              ))}
              
              {/* Academy Section */}
              <div className="pt-2">
                <button 
                  onClick={() => setAcademyOpen(!academyOpen)}
                  className="flex items-center justify-between w-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  <span className="flex items-center gap-3">
                    <GraduationCap className="h-4 w-4" />
                    Academy
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${academyOpen ? "rotate-180" : ""}`} />
                </button>
                {academyOpen && (
                  <div className="mt-1 ml-4 space-y-1 border-l border-border pl-2">
                    {academyLinks.map((link) => (
                      <NavItem key={link.href} {...link} />
                    ))}
                  </div>
                )}
              </div>
            </nav>
            <div className="p-4 border-t border-border flex items-center justify-between">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-destructive hover:underline"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
              <ModeToggle />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r border-border bg-card md:flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b border-border">
          <Link href="/" className="text-xl font-bold flex items-center gap-2">
            <span className="text-primary text-2xl">⌘</span>
            <span className="tracking-tight">Kybern Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map((link) => (
            <NavItem key={link.href} {...link} />
          ))}

          {/* Academy Section */}
          <div className="pt-4">
            <button 
              onClick={() => setAcademyOpen(!academyOpen)}
              className="flex items-center justify-between w-full px-4 py-2 text-xs font-bold text-muted-foreground/60 hover:text-foreground transition-colors uppercase tracking-widest mb-1"
            >
              <span className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4" />
                Academy
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${academyOpen ? "rotate-180" : ""}`} />
            </button>
            {academyOpen && (
              <div className="mt-1 space-y-1">
                {academyLinks.map((link) => (
                  <NavItem key={link.href} {...link} />
                ))}
              </div>
            )}
          </div>
        </nav>
        <div className="p-4 border-t border-border flex items-center justify-between">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-destructive hover:underline"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
          <ModeToggle />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full max-w-[100vw]">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
