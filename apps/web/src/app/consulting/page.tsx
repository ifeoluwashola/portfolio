import type { Metadata } from "next";
import { HeroSection } from "@/components/HeroSection";
import { EngineerTeaser } from "@/components/EngineerTeaser";
import { FirmPhilosophy } from "@/components/FirmPhilosophy";
import { PainPointsSection } from "@/components/PainPointsSection";
import { ServicesGrid } from "@/components/ServicesGrid";
import { EngagementProcess } from "@/components/EngagementProcess";
import { ProjectsGrid } from "@/components/ProjectsGrid";
import { LatestPosts } from "@/components/LatestPosts";
import { ContactSection } from "@/components/ContactSection";
import { OurEngineers } from "@/components/OurEngineers";
import { PricingSection } from "@/components/PricingSection";
export const metadata: Metadata = {
  title: "Cloud & DevOps Consulting",
  description: "Infrastructure audits, CI/CD pipeline rebuilds, Kubernetes architecture, and IaC migration. Senior DevOps consulting for startups and scale-ups on AWS, GCP, and Azure.",
};

export default function ConsultingPage() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <PainPointsSection />
      <FirmPhilosophy />
      <ServicesGrid />
      <OurEngineers />
      <EngagementProcess />
      <PricingSection />
      <EngineerTeaser />
      <ProjectsGrid />
      <LatestPosts />
      <ContactSection />
    </main>
  );
}


