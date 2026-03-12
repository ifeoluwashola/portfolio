import Link from "next/link";
import { Github, Linkedin, Mail, Phone } from "lucide-react";

interface ProfileData {
  email: string;
  phone: string;
  whatsapp_number: string;
  github_url: string;
  linkedin_url: string;
  twitter_url: string;
}

const defaultProfile: ProfileData = {
  email: "hello@example.com",
  phone: "",
  whatsapp_number: "",
  github_url: "#",
  linkedin_url: "#",
  twitter_url: "#"
};

export async function Footer() {
  const currentYear = new Date().getFullYear();
  let profile = defaultProfile;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8081/api"}/profile`, {
      next: { revalidate: 10 } // Revalidate caching periodically
    });
    if (res.ok) {
      const data = await res.json();
      if (data.id && data.id !== 0) {
        profile = {
          email: data.email || defaultProfile.email,
          phone: data.phone || defaultProfile.phone,
          whatsapp_number: data.whatsapp_number || defaultProfile.whatsapp_number,
          github_url: data.github_url || defaultProfile.github_url,
          linkedin_url: data.linkedin_url || defaultProfile.linkedin_url,
          twitter_url: data.twitter_url || defaultProfile.twitter_url,
        };
      }
    }
  } catch (error) {
    console.error("Failed to fetch profile data for footer:", error);
  }

  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2 flex-wrap gap-y-4">
          
          {profile.linkedin_url && profile.linkedin_url !== "#" && (
            <Link href={profile.linkedin_url} target="_blank" className="text-muted-foreground hover:text-foreground transition-colors group">
              <span className="sr-only">LinkedIn</span>
              <Linkedin className="h-6 w-6 group-hover:text-[#0A66C2]" aria-hidden="true" />
            </Link>
          )}

          {profile.github_url && profile.github_url !== "#" && (
            <Link href={profile.github_url} target="_blank" className="text-muted-foreground hover:text-foreground transition-colors group">
              <span className="sr-only">GitHub</span>
              <Github className="h-6 w-6 group-hover:text-white" aria-hidden="true" />
            </Link>
          )}

          {profile.twitter_url && profile.twitter_url !== "#" && (
            <Link href={profile.twitter_url} target="_blank" className="text-muted-foreground hover:text-foreground transition-colors group">
              <span className="sr-only">X (Twitter)</span>
              <svg className="w-6 h-6 fill-current group-hover:text-foreground" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </Link>
          )}

          {profile.email && (
            <Link href={`mailto:${profile.email}`} className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="sr-only">Email</span>
              <Mail className="h-6 w-6" aria-hidden="true" />
            </Link>
          )}

        </div>
        <div className="mt-8 md:order-1 md:mt-0">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
            <Link href="/" className="font-bold text-lg tracking-tight text-foreground flex items-center gap-2">
              <span className="text-emerald-500">⌘</span> Ifeoluwa
            </Link>
          </div>
          <p className="text-center md:text-left text-sm leading-5 text-muted-foreground">
            &copy; {currentYear} Ifeoluwa. All rights reserved.
          </p>
          <div className="mt-4 flex justify-center md:justify-start gap-6 text-sm text-muted-foreground">
            <Link href="/#services" className="hover:text-emerald-500 transition-colors">Services</Link>
            <Link href="/#projects" className="hover:text-sky-500 transition-colors">Projects</Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
