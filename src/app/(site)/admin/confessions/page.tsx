"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Confession } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default function AdminConfessionsPage() {
  const [items, setItems] = useState<Confession[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("confessions")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems(data ?? []));
  }, []);

  async function hide(id: string) {
    const supabase = createClient();
    await supabase.from("confessions").update({ hidden: true }).eq("id", id);
    setItems((prev) => prev.filter((c) => c.id !== id));
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("confessions").delete().eq("id", id);
    setItems((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
        ← Admin
      </Link>
      <h1 className="font-display mt-4 text-3xl font-bold">Moderate confessions</h1>
      <ul className="mt-8 space-y-4">
        {items.map((c) => (
          <li
            key={c.id}
            className={`rounded-lg border p-4 ${c.hidden ? "opacity-50" : ""}`}
          >
            <p className="whitespace-pre-wrap">{c.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {c.category} · {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
              {c.hidden && " · hidden"}
            </p>
            <div className="mt-3 flex gap-2">
              {!c.hidden && (
                <Button variant="outline" size="sm" onClick={() => hide(c.id)}>
                  Hide
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={() => remove(c.id)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
