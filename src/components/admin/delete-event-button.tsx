"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface DeleteEventButtonProps {
  eventId: string;
  eventTitle: string;
  redirectTo?: string;
  size?: "sm" | "default";
}

export function DeleteEventButton({
  eventId,
  eventTitle,
  redirectTo = "/admin/events",
  size = "sm",
}: DeleteEventButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${eventTitle}"? RSVPs and images for this event will be removed.`
    );
    if (!confirmed) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    setLoading(false);

    if (error) {
      window.alert(error.message);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size={size}
      disabled={loading}
      onClick={handleDelete}
    >
      {loading ? "Deleting…" : "Delete"}
    </Button>
  );
}
