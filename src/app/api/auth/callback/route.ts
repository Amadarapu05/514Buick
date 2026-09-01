import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isHostEmail } from "@/lib/auth/hosts";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user?.email && isHostEmail(data.user.email)) {
      await supabase
        .from("profiles")
        .update({ role: "host" })
        .eq("id", data.user.id);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
