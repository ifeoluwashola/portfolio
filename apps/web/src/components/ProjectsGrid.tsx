"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github, ArrowRight, Star, GitFork } from "lucide-react";
import Link from "next/link";

export function ProjectsGrid() {
  const [projects, setProjects] = useState<{title: string, description: string, tags: string[], githubUrl: string, caseStudyUrl: string, borderColor?: string, color?: string}[]>([]);
  const [guardrailStats, setGuardrailStats] = useState<{ stars: number; forks: number } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const projRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api"}/projects`);
        if (projRes.ok) {
          const data = await projRes.json();
          setProjects(data);
        }

        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api"}/projects/guardrail/stats`);
        if (statsRes.ok) {
          const data = await statsRes.json();
          setGuardrailStats({ stars: data.stars, forks: data.forks });
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    }
    fetchData();
  }, []);

  return (
    <section id="projects" className="py-24 sm:py-32 bg-background border-t border-border relative overflow-hidden">
      {/* Background glow for projects */}
      <div className="absolute inset-x-0 bottom-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#10b981] to-[#0ea5e9] opacity-10 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-emerald-400">Engineering Showcase</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Featured Projects
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Tools and systems I&apos;ve built to optimize workflows and scale businesses.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
            {projects.map((project) => (
              <Card key={project.title} className={`bg-card/50 backdrop-blur-sm border ${project.borderColor} hover:border-foreground/20 transition-all duration-300 relative overflow-hidden group`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-50 group-hover:opacity-100 transition-opacity duration-500`}></div>
                <div className="relative z-10 h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-foreground dark:text-white flex items-center justify-between">
                      {project.title}
                      <div className="flex items-center gap-4">
                        {project.title === "Guardrail" && guardrailStats && (
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mr-2 font-normal">
                            <span className="flex items-center gap-1"><Star className="w-4 h-4" /> {guardrailStats.stars}</span>
                            <span className="flex items-center gap-1"><GitFork className="w-4 h-4" /> {guardrailStats.forks}</span>
                          </div>
                        )}
                        <Link href={project.githubUrl} className="text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors">
                          <Github className="w-6 h-6" />
                        </Link>
                      </div>
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {project.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-border">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <CardDescription className="text-base text-muted-foreground">
                      {project.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="pt-4">
                    <Link href={project.caseStudyUrl} className="w-full sm:w-auto">
                      <Button variant="outline" className="w-full gap-2 border-border hover:bg-accent">
                        Read Case Study <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
