import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { createHash } from "crypto";

const RATE_LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000;

const rateMap = new Map<string, { count: number; reset: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.reset) {
    rateMap.set(key, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  const body = await request.json();
  const text = typeof body.body === "string" ? body.body.trim() : "";
  const category = body.category ?? "confession";

  if (text.length < 3 || text.length > 500) {
    return NextResponse.json({ error: "Message must be 3–500 characters." }, { status: 400 });
  }

  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for") ?? "anon";
  const rateKey = createHash("sha256").update(forwarded).digest("hex").slice(0, 16);

  if (!checkRateLimit(rateKey)) {
    return NextResponse.json(
      { error: "Too many posts. Try again later." },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("confessions").insert({
    body: text,
    category,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
