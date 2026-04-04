import Link from "next/link";
import { cookies } from "next/headers";
import { ModeToggle } from "../ModeToggle";
import { LayoutDashboard, Brain, GraduationCap } from "lucide-react";

export async function AcademyNavbar() {
  const cookieStore = await cookies();
  const token = cookieStore.get("academy_token")?.value;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto">
        <Link href="/academy" className="text-xl font-bold flex items-center gap-2 text-slate-100 font-mono">
          <span className="text-yellow-500 tracking-tighter">{">_ "}</span> Kybern Academy
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center text-xs font-bold text-slate-400 font-mono tracking-widest uppercase">
          <Link href="/academy" className="hover:text-yellow-500 transition-colors">Home</Link>
          <Link href="/academy/break-it-labs" className="hover:text-yellow-500 transition-colors">Labs Hub</Link>
          <Link href="/academy/alumni" className="hover:text-yellow-500 transition-colors">Alumni</Link>
        </div>

        <div className="flex items-center gap-4">
          <ModeToggle variant="academy" />
          {!token && (
            <Link href="/academy#apply" className="hidden sm:block px-4 py-2 border border-slate-800 text-slate-300 text-[10px] font-bold tracking-widest uppercase rounded hover:bg-slate-900 transition-all">
              Enroll_Now
            </Link>
          )}
          {token ? (
            <Link href="/academy/dashboard" className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[10px] font-bold tracking-widest uppercase rounded hover:bg-yellow-500/20 transition-all">
              Dashboard / Terminal
            </Link>
          ) : (
            <Link href="/academy/login" className="px-4 py-2 bg-yellow-500 text-slate-950 text-[10px] font-bold tracking-widest uppercase rounded hover:bg-yellow-400 transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              Student_Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
