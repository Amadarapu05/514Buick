"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Birthday } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminBirthdaysPage() {
  const [items, setItems] = useState<Birthday[]>([]);
  const [name, setName] = useState("");
  const [month, setMonth] = useState("1");
  const [day, setDay] = useState("1");
  const [birthYear, setBirthYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadItems() {
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("birthdays")
      .select("*")
      .order("month")
      .order("day");

    if (loadError) {
      setError(loadError.message);
      return;
    }
    setItems(
      (data ?? []).map((row) => ({
        ...row,
        birth_year: row.birth_year ?? null,
      }))
    );
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const trimmedName = name.trim();
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);

    if (!trimmedName) {
      setError("Name is required.");
      setLoading(false);
      return;
    }
    if (Number.isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      setError("Month must be between 1 and 12.");
      setLoading(false);
      return;
    }
    if (Number.isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      setError("Day must be between 1 and 31.");
      setLoading(false);
      return;
    }

    const payload: {
      name: string;
      month: number;
      day: number;
      birth_year?: number;
    } = {
      name: trimmedName,
      month: monthNum,
      day: dayNum,
    };

    const yearTrimmed = birthYear.trim();
    if (yearTrimmed) {
      const yearNum = parseInt(yearTrimmed, 10);
      if (Number.isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
        setError("Birth year must be between 1900 and 2100.");
        setLoading(false);
        return;
      }
      payload.birth_year = yearNum;
    }

    const supabase = createClient();
    let result = await supabase.from("birthdays").insert(payload).select().single();

    if (
      result.error &&
      payload.birth_year != null &&
      result.error.message.toLowerCase().includes("birth_year")
    ) {
      const { birth_year: _y, ...withoutYear } = payload;
      result = await supabase.from("birthdays").insert(withoutYear).select().single();
      if (!result.error) {
        setNotice(
          "Birthday saved without birth year. Run supabase/migrations/003_birthday_birth_year.sql in the Supabase SQL Editor to enable “21st birthday” labels."
        );
      }
    }

    setLoading(false);

    if (result.error) {
      const msg = result.error.message;
      if (msg.includes("row-level security") || msg.includes("permission")) {
        setError(
          "Could not save — your account needs host role. Check HOST_EMAILS in .env.local and sign in again."
        );
      } else {
        setError(msg);
      }
      return;
    }

    if (result.data) {
      setItems((prev) => [
        ...prev,
        { ...result.data, birth_year: result.data.birth_year ?? null },
      ]);
      setName("");
      setBirthYear("");
      if (!notice) setNotice("Birthday added.");
    }
  }

  async function remove(id: string) {
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("birthdays")
      .delete()
      .eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setItems((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
        ← Admin
      </Link>
      <h1 className="font-display mt-4 text-3xl font-bold">Birthdays</h1>
      <form onSubmit={add} className="mt-8 space-y-4 rounded-lg border border-border p-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="month">Month</Label>
            <Input
              id="month"
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="day">Day</Label>
            <Input
              id="day"
              type="number"
              min={1}
              max={31}
              value={day}
              onChange={(e) => setDay(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthYear">Birth year (optional)</Label>
          <Input
            id="birthYear"
            type="number"
            min={1900}
            max={2100}
            placeholder="e.g. 2004 for 21st birthday"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {notice && <p className="text-sm text-accent">{notice}</p>}
        <Button type="submit" variant="accent" disabled={loading}>
          {loading ? "Adding…" : "Add birthday"}
        </Button>
      </form>
      <ul className="mt-8 space-y-2">
        {items.map((b) => (
          <li
            key={b.id}
            className="flex items-center justify-between rounded-lg border border-border p-3"
          >
            <span>
              {b.name} — {b.month}/{b.day}
              {b.birth_year ? ` · born ${b.birth_year}` : ""}
            </span>
            <Button variant="ghost" size="sm" onClick={() => remove(b.id)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
