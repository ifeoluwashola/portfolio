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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-mono selection:bg-yellow-500/30">
      <AcademyNavbar />
      <main className="flex-1 overflow-x-hidden pt-16">
        {children}
      </main>
    </div>
  );
}
