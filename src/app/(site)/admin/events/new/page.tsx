import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/admin/event-form";

export default async function NewEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "host") redirect("/");

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Link href="/admin/events" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back
      </Link>
      <h1 className="font-display mt-4 text-3xl font-bold">New event</h1>
      <div className="mt-8">
        <EventForm />
      </div>
    </div>
  );
}
