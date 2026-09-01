import Link from "next/link";
import { cn } from "@/lib/utils";

export function EventsTabs({ active }: { active: string }) {
  const tabs = [
    { id: "upcoming", label: "Upcoming" },
    { id: "past", label: "Past" },
  ];

  return (
    <div className="flex gap-6 border-b border-white/[0.06]">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={`/events?tab=${tab.id}`}
          className={cn(
            "relative pb-3 text-sm font-medium transition-colors duration-200",
            active === tab.id
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground/80"
          )}
        >
          {tab.label}
          {/* Animated active indicator */}
          <span
            className={cn(
              "absolute bottom-0 left-0 h-px w-full origin-left transition-all duration-300",
              active === tab.id ? "scale-x-100" : "scale-x-0"
            )}
            style={{
              background: "linear-gradient(90deg, #c9a227, #e8c040)",
              boxShadow: active === tab.id
                ? "0 0 8px rgba(201, 162, 39, 0.5)"
                : "none",
            }}
            aria-hidden
          />
        </Link>
      ))}
    </div>
  );
}
