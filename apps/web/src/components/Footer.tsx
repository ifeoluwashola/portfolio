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

          {profile.phone && (
            <Link href={`tel:${profile.phone}`} className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="sr-only">Phone</span>
              <Phone className="h-6 w-6" aria-hidden="true" />
            </Link>
          )}

          {profile.whatsapp_number && (
            <Link href={`https://wa.me/${profile.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" className="text-muted-foreground hover:text-foreground transition-colors group">
              <span className="sr-only">WhatsApp</span>
              <svg className="w-6 h-6 fill-current group-hover:text-[#25D366]" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
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
