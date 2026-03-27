import { HeroSection } from "@/components/HeroSection";
import { FirmPhilosophy } from "@/components/FirmPhilosophy";
import { PainPointsSection } from "@/components/PainPointsSection";
import { ServicesGrid } from "@/components/ServicesGrid";
import { ProjectsGrid } from "@/components/ProjectsGrid";
import { LatestPosts } from "@/components/LatestPosts";
import { ContactSection } from "@/components/ContactSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <FirmPhilosophy />
      <PainPointsSection />
      <ServicesGrid />
      <ProjectsGrid />
      <LatestPosts />
      <ContactSection />
    </main>
  );
}


