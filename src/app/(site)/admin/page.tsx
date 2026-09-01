import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
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

  const links = [
    { href: "/admin/events", label: "Manage events", desc: "Create and edit events" },
    { href: "/admin/confessions", label: "Moderate confessions", desc: "Hide or remove posts" },
    { href: "/admin/birthdays", label: "Birthdays", desc: "TV dashboard birthdays" },
    { href: "/admin/carousel", label: "Homepage photos", desc: "Carousel images" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Admin</h1>
      <p className="mt-2 text-muted-foreground">Host tools for 514 Buick</p>
      <ul className="mt-10 space-y-4">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-lg border border-border p-5 transition-colors hover:bg-muted"
            >
              <span className="font-medium">{item.label}</span>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
