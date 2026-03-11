import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { ServicesGrid } from "@/components/ServicesGrid";
import { ProjectsGrid } from "@/components/ProjectsGrid";
import { LatestPosts } from "@/components/LatestPosts";
import { ContactSection } from "@/components/ContactSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <AboutSection />
      <ServicesGrid />
      <ProjectsGrid />
      <LatestPosts />
      <ContactSection />
    </main>
  );
}


