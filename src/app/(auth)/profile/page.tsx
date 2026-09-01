import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/auth/profile-form";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display mb-2 text-3xl font-semibold">Profile</h1>
      <p className="mb-8 text-muted-foreground">{user.email}</p>
      {profile && <ProfileForm profile={profile} />}
      <div className="mt-8">
        <SignOutButton />
      </div>
    </div>
  );
}
