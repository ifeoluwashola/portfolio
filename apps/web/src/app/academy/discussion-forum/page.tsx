import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AcademyNavbar } from "@/components/academy/AcademyNavbar";
import { DiscussionForumFeed } from "@/components/academy/DiscussionForumFeed";

export const metadata = {
  title: "Kybern Academy | Discussion Forum",
  description: "Internal discussion forum and knowledge base for Kybern Academy students.",
};

export default async function DiscussionForumPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("academy_token")?.value;

  if (!token) {
    redirect("/academy/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-24">
      <AcademyNavbar />
      <div className="max-w-7xl mx-auto px-6">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px] text-yellow-400 font-mono animate-pulse uppercase tracking-widest text-xs">
            Loading Discussion Forum...
          </div>
        }>
          <DiscussionForumFeed />
        </Suspense>
      </div>
    </div>
  );
}
