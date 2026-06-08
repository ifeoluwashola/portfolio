import { AcademyNavbar } from "@/components/academy/AcademyNavbar";

export const metadata = {
  title: "Kybern Academy | Premium Cloud Native Mentorship",
  description: "A rigorous 16-week live mentorship program to break into Cloud Engineering.",
  icons: {
    icon: "/academy/icon.svg",
  },
};

export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" />
      <div className="min-h-screen bg-background text-foreground selection:bg-yellow-500/30 font-mono pb-40 transition-colors duration-300">
        <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
    </>
  );
}
