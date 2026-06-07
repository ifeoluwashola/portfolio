import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("academy_token")?.value;

  if (!token) {
    redirect("/academy/login");
  }

  // Redirect to the main Discussion Forum page with the thread query parameter
  redirect(`/academy/discussion-forum?thread=${id}`);
}
