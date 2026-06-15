import type { Metadata } from "next";
import { PricingUI } from "@/components/PricingUI";

export const metadata: Metadata = {
  title: "Plans & Pricing | Kybern Nexus",
  description: "Senior DevOps capacity, billed how you want. View our pricing models, including hourly consulting, project-based migration, and staff augmentation retainers.",
};

export default function PricingPage() {
  return <PricingUI />;
}
