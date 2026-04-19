import { AcademyNavbar } from "@/components/academy/AcademyNavbar";

export const metadata = {
  title: "Kybern Academy | Premium Cloud Native Mentorship",
  description: "A rigorous 12-week live mentorship program to break into Cloud Engineering.",
};

export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-yellow-500/30 font-mono pb-40 transition-colors duration-300">
      <AcademyNavbar />
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
