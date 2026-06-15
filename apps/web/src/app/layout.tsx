import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default:
      "Kybern Nexus — Cloud Consulting, DevOps Training & IoT Solutions",
    template: "%s | Kybern Nexus",
  },
  description:
    "We help engineering teams cut cloud costs, automate deployments, and build infrastructure that scales. Senior-led consulting and production-grade training for high-growth teams.",
  keywords: [
    // Consultancy pillar
    "Software Consultancy",
    "IT Consulting",
    "Cloud Infrastructure Consulting",
    "Enterprise Software Development",
    "Cloud-Native Architecture",
    "DevOps Consulting",
    "AWS Infrastructure",
    "GCP Scaling",
    "Kubernetes Migration",
    "CI/CD Pipeline",
    "Site Reliability Engineering",
    "Terraform",
    "GitOps",
    "Cloud Cost Optimization",
    // Academy pillar
    "Kybern Academy",
    "Cloud Engineering Training",
    "DevOps Training",
    "Kubernetes Training",
    "Terraform Training",
    "Hands-On Cloud Labs",
    "Production-Grade Engineering Course",
    // IoT pillar
    "IoT Solutions",
    "Smart Device Engineering",
    "Embedded Systems",
    // Brand
    "Kybern Nexus",
  ],
  openGraph: {
    title:
      "Kybern Nexus | Software Consultancy, Cloud Engineering Academy & IoT Solutions",
    description:
      "We engineer reality — enterprise software consulting, production-grade cloud engineering training at Kybern Academy, and custom IoT solutions. Building, scaling, and teaching the systems that power modern business.",
    type: "website",
    siteName: "Kybern Nexus",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Kybern Nexus | Software Consultancy, Cloud Academy & IoT",
    description:
      "Enterprise software consulting · Cloud engineering training · IoT solutions — Kybern Nexus engineers reality.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground flex flex-col min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}


