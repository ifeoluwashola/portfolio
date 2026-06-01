import Link from "next/link";
import { cookies } from "next/headers";
import { ModeToggle } from "../ModeToggle";
import { User } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { NotificationBell } from "./NotificationBell";

async function fetchAvatarUrl(token: string): Promise<string | null> {
  try {
    const profileRes = await fetch(`${API_BASE_URL}/v1/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!profileRes.ok) return null;
    const profile = await profileRes.json() as { avatar_s3_key?: string };
    if (!profile.avatar_s3_key) return null;

    const dlRes = await fetch(
      `${API_BASE_URL}/v1/media/download-url?key=${encodeURIComponent(profile.avatar_s3_key)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!dlRes.ok) return null;
    const dlData = await dlRes.json() as { download_url: string };
    return dlData.download_url ?? null;
  } catch {
    return null;
  }
}

export async function AcademyNavbar() {
  const cookieStore = await cookies();
  const token = cookieStore.get("academy_token")?.value;
  const avatarUrl = token ? await fetchAvatarUrl(token) : null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto gap-4">

        {/* Logo */}
        <Link href="/academy" className="flex items-center gap-3 transition-opacity hover:opacity-80 flex-shrink-0">
          <img 
            src="/logo-academy-dark.png" 
            alt="Kybern Academy" 
            className="hidden dark:block h-8 w-auto" 
          />
          <img 
            src="/logo-academy-light.png" 
            alt="Kybern Academy" 
            className="block dark:hidden h-8 w-auto" 
          />
          <span className="sr-only">Kybern Academy</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex flex-1 justify-center gap-8 items-center text-[10px] font-bold text-muted-foreground/60 font-mono tracking-[0.15em] uppercase">
          <Link href="/academy" className="hover:text-foreground transition-colors">Home</Link>
          <Link href="/academy/break-it-labs" className="hover:text-foreground transition-colors">Labs</Link>
          <Link href="/academy/alumni" className="hover:text-foreground transition-colors">Alumni</Link>
          <Link href="/academy/materials" className="hover:text-foreground transition-colors">Resources</Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <ModeToggle variant="academy" />

          {token ? (
            <>
              <NotificationBell />
              <Link
                href="/academy/dashboard"
                className="flex items-center gap-2.5 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-[10px] font-black tracking-[0.15em] uppercase rounded-lg hover:bg-yellow-500/20 transition-all"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Your avatar"
                    className="w-5 h-5 rounded-full object-cover border border-yellow-500/40"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                Dashboard →
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/academy/login"
                className="px-4 py-2 text-muted-foreground/60 hover:text-foreground text-[10px] font-bold tracking-[0.15em] uppercase transition-colors"
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
