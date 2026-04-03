import { AcademyNavbar } from "@/components/academy/AcademyNavbar";

export default function PublicAcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AcademyNavbar />
      <div className="pt-16 min-h-screen">
        {children}
      </div>
    </>
  );
}
