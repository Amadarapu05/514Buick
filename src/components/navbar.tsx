import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavClient } from "@/components/nav-client";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isHost = false;
  let displayName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, display_name")
      .eq("id", user.id)
      .single();
    isHost = profile?.role === "host";
    displayName = profile?.display_name ?? null;
  }

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-black/40 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-wide"
        >
          <span className="shimmer-gold">514 Buick</span>
        </Link>
        <NavClient user={user ? { isHost, displayName } : null} />
      </nav>
    </header>
  );
}
