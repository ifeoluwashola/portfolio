import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { Footer } from "@/components/Footer";

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
    default: "Ifeoluwa | DevOps & Cloud Infrastructure Consulting",
    template: "%s | Ifeoluwa Consulting",
  },
  description:
    "Enterprise-grade DevOps and Cloud Infrastructure consulting. We partner with high-growth engineering teams to cut cloud costs, harden CI/CD pipelines, and scale reliably.",
  keywords: [
    "DevOps Consultant",
    "Cloud Cost Optimization",
    "AWS Infrastructure Audit",
    "GCP Scaling",
    "Kubernetes Migration",
    "CI/CD Pipeline Hardening",
    "Site Reliability Engineering",
    "GitOps",
    "Terraform Expert",
  ],
  openGraph: {
    title: "Ifeoluwa | DevOps & Cloud Infrastructure Consulting",
    description:
      "Enterprise-grade DevOps and Cloud Infrastructure consulting. We partner with high-growth engineering teams to cut cloud costs, harden CI/CD pipelines, and scale reliably.",
    type: "website",
  },
  twitter: {
    title: "Ifeoluwa | DevOps & Cloud Infrastructure Consulting",
    description:
      "Enterprise-grade DevOps and Cloud Infrastructure consulting. We partner with high-growth engineering teams to cut cloud costs, harden CI/CD pipelines, and scale reliably.",
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
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}


