import { getAcademyMaterials } from "@/lib/mdx";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowRight, BookOpen } from "lucide-react";

export default function AcademyMaterialsIndex() {
  const materials = getAcademyMaterials();

  return (
    <div className="bg-background min-h-screen py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Breadcrumb / Ecosystem indicator */}
        <div className="mb-8 flex items-center space-x-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span className="font-medium text-emerald-400">Academy Hub</span>
          <span>/</span>
          <span>Prerequisite Materials</span>
        </div>

        <div className="mx-auto max-w-2xl lg:mx-0 mb-10 border-b border-border pb-6">
          <h2 className="text-3xl font-bold tracking-tight text-emerald-400 sm:text-4xl">
            Academy Learning Hub: Prerequisite Materials
          </h2>
          <p className="mt-2 text-lg leading-8 text-muted-foreground">
            Master the foundational skills required to transition into DevOps, Cloud Engineering, and SRE.
          </p>
        </div>

        <div className="grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {materials.map((material) => (
            <article
              key={material.slug}
              className="flex max-w-xl flex-col items-start justify-between bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border hover:border-emerald-500/50 transition-all duration-300"
            >
              <div className="flex items-center gap-x-4 text-xs">
                <time dateTime={material.date} className="text-muted-foreground">
                  {material.date
                    ? format(parseISO(material.date), "MMMM d, yyyy")
                    : "Unknown Date"}
                </time>
                <span className="relative z-10 rounded-full px-3 py-1.5 font-medium bg-sky-500/10 text-sky-400">
                  {material.category}
                </span>
              </div>
              <div className="group relative">
                <h3 className="mt-3 text-lg font-semibold leading-6 text-foreground group-hover:text-emerald-400 transition-colors">
                  <Link href={`/academy/materials/${material.slug}`}>
                    <span className="absolute inset-0" />
                    {material.title}
                  </Link>
                </h3>
                <p className="mt-5 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {material.description}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-x-4 w-full border-t border-border pt-4">
                <Link
                  href={`/academy/materials/${material.slug}`}
                  className="text-sm font-semibold leading-6 text-emerald-400 flex flex-row items-center gap-2 group w-full justify-between"
                >
                  Start Learning
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
