import type { Metadata } from "next";
import { AboutUI } from "@/components/AboutUI";

export const metadata: Metadata = {
  title: "About Us | Kybern Nexus",
  description: "Learn about Kybern Nexus, our mission to solve Deployment Paralysis, and how our Consulting and Academy arms create the ultimate elite engineering pipeline.",
};

export default function AboutPage() {
  return <AboutUI />;
}
