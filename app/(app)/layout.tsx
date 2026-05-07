import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/ui/Sidebar";
import { ToastContainer } from "@/components/ui/Toast";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  // Fetch all of the user's trips (Sidebar derives active trip from pathname client-side)
  const { data: trips } = await supabase
    .from("trips")
    .select("id, name, start_date, end_date, organiser_id, share_token, cover_image_url, description, deleted_at, created_at, updated_at")
    .is("deleted_at", null)
    .order("start_date", { ascending: true });

  const userName = profile?.display_name ?? user.email?.split("@")[0] ?? "User";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* Sidebar — fixed left; derives currentTripId from pathname client-side */}
      <div className="hidden md:flex w-[260px] shrink-0 flex-col h-full">
        <Sidebar
          trips={trips ?? []}
          userId={user.id}
          userName={userName}
          userAvatarUrl={profile?.avatar_url}
        />
      </div>

      {/* Main content — scrollable */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
