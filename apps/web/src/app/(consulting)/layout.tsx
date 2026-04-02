import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function ConsultingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </>
  );
}
