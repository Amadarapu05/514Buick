"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CarouselRow {
  id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export default function AdminCarouselPage() {
  const [items, setItems] = useState<CarouselRow[]>([]);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("carousel_images")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setItems(data ?? []));
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { data } = await supabase
      .from("carousel_images")
      .insert({
        url,
        alt_text: alt || null,
        sort_order: items.length,
      })
      .select()
      .single();
    if (data) setItems((prev) => [...prev, data]);
    setUrl("");
    setAlt("");
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("carousel_images").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
        ← Admin
      </Link>
      <h1 className="font-display mt-4 text-3xl font-bold">Homepage carousel</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Add image URLs (Unsplash, Supabase Storage, etc.)
      </p>
      <form onSubmit={add} className="mt-8 space-y-4 rounded-lg border border-border p-4">
        <div className="space-y-2">
          <Label htmlFor="url">Image URL</Label>
          <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="alt">Alt text</Label>
          <Input id="alt" value={alt} onChange={(e) => setAlt(e.target.value)} />
        </div>
        <Button type="submit" variant="accent">
          Add photo
        </Button>
      </form>
      <ul className="mt-8 space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
          >
            <span className="truncate text-sm">{item.url}</span>
            <Button variant="ghost" size="sm" onClick={() => remove(item.id)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
