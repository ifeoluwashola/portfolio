import { KybernNexusNavbar } from "@/components/KybernNexusNavbar";
import { KybernNexusFooter } from "@/components/KybernNexusFooter";

export default function ConsultingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-kn-bg min-h-screen text-kn-body font-sans selection:bg-kn-accent/30 selection:text-kn-heading">
      <KybernNexusNavbar />
      <div className="flex-1 pt-20">
        {children}
      </div>
      <KybernNexusFooter />
    </div>
  );
}
