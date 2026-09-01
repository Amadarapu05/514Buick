"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PublicRsvpEntry {
  id: string;
  status: "going" | "maybe";
  displayName: string;
}

interface RsvpListDialogProps {
  rsvps: PublicRsvpEntry[];
  goingCount: number;
  maybeCount: number;
}

function statusLabel(status: PublicRsvpEntry["status"]) {
  return status === "going" ? "Going" : "Maybe";
}

export function RsvpListDialog({
  rsvps,
  goingCount,
  maybeCount,
}: RsvpListDialogProps) {
  const [open, setOpen] = useState(false);
  const total = goingCount + maybeCount;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Guest list ({total})
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rsvp-list-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close guest list"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 flex max-h-[min(85vh,28rem)] w-full max-w-md flex-col rounded-lg border border-border bg-card shadow-xl sm:max-h-[32rem]">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <h2
                id="rsvp-list-title"
                className="font-display text-lg font-semibold"
              >
                Guest list
              </h2>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-2xl leading-none text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            <p className="shrink-0 border-b border-border px-4 py-2 text-sm text-muted-foreground">
              {goingCount} going · {maybeCount} maybe
            </p>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
              {rsvps.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No RSVPs yet. Be the first!
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {rsvps.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-3 px-2 py-3"
                    >
                      <span className="font-medium">{entry.displayName}</span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          entry.status === "going"
                            ? "bg-accent/20 text-accent"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {statusLabel(entry.status)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
