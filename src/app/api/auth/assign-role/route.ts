import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isHostEmail } from "@/lib/auth/hosts";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isHostEmail(user.email)) {
    await supabase.from("profiles").update({ role: "host" }).eq("id", user.id);
    return NextResponse.json({ role: "host" });
  }

  // Non-hosts are not allowed — keep role as guest and let the client sign them out
  return NextResponse.json({ role: "guest" });
}
