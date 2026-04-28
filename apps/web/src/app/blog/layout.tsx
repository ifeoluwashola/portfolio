import { KybernNexusNavbar } from "@/components/KybernNexusNavbar";
import { KybernNexusFooter } from "@/components/KybernNexusFooter";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0f172a] min-h-screen text-slate-200 font-sans selection:bg-[#eab308] selection:text-[#0f172a]">
      <KybernNexusNavbar />
      <div className="flex-1 pt-20">
        {children}
      </div>
      <KybernNexusFooter />
    </div>
  );
}
