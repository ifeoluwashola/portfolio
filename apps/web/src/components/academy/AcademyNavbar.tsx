import Link from "next/link";
import { cookies } from "next/headers";
import { ModeToggle } from "../ModeToggle";
import { Terminal } from "lucide-react";

export async function AcademyNavbar() {
  const cookieStore = await cookies();
  const token = cookieStore.get("academy_token")?.value;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto gap-4">

        {/* Logo */}
        <Link href="/academy" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-yellow-500" />
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-slate-100 group-hover:text-yellow-400 transition-colors">
            Kybern
          </span>
          <span className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 border border-slate-800 px-1.5 py-0.5 rounded">
            Academy
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex flex-1 justify-center gap-8 items-center text-[10px] font-bold text-slate-500 font-mono tracking-[0.15em] uppercase">
          <Link href="/academy" className="hover:text-yellow-400 transition-colors">Home</Link>
          <Link href="/academy/break-it-labs" className="hover:text-yellow-400 transition-colors">Labs</Link>
          <Link href="/academy/alumni" className="hover:text-yellow-400 transition-colors">Alumni</Link>
          <Link href="/academy/materials" className="hover:text-yellow-400 transition-colors">Resources</Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <ModeToggle variant="academy" />

          {token ? (
            <Link
              href="/academy/dashboard"
              className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-black tracking-[0.15em] uppercase rounded-lg hover:bg-yellow-500/20 transition-all"
            >
              Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/academy/login"
                className="hidden sm:block px-4 py-2 text-slate-500 hover:text-slate-300 text-[10px] font-bold tracking-[0.15em] uppercase transition-colors"
              >
                Login
              </Link>
              {/* Sticky Apply CTA — always visible */}
              <Link
                href="/academy/register"
                className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-[10px] font-black tracking-[0.15em] uppercase rounded-lg transition-all shadow-[0_0_15px_rgba(234,179,8,0.25)] hover:shadow-[0_0_25px_rgba(234,179,8,0.4)] whitespace-nowrap"
              >
                Apply Now →
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
