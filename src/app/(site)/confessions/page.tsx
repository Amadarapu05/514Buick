import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ConfessionForm } from "@/components/confessions/confession-form";
import { ScrollReveal } from "@/components/scroll-reveal";

const CATEGORY_LABELS: Record<string, string> = {
  confession: "Confession",
  feedback: "Feedback",
  suggestion: "Suggestion",
};

export default async function ConfessionsPage() {
  const supabase = await createClient();
  const { data: confessions } = await supabase
    .from("confessions")
    .select("*")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Page header */}
      <div className="animate-fade-in-up mb-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent/70">
          514 Buick
        </p>
        <h1 className="font-display text-4xl font-bold md:text-5xl">
          Confessions
        </h1>
        <div
          className="mt-3 h-px w-12"
          style={{ background: "linear-gradient(90deg, #c9a227, transparent)" }}
          aria-hidden
        />
        <p className="mt-3 text-muted-foreground">
          Anonymous thoughts, feedback, and suggestions for 514 Buick.
        </p>
      </div>

      {/* Submission form */}
      <ScrollReveal className="mb-12">
        <ConfessionForm />
      </ScrollReveal>

      {/* Confessions list */}
      {confessions && confessions.length > 0 ? (
        <ul className="space-y-4">
          {confessions.map((c, i) => (
            <ScrollReveal key={c.id} delay={i * 50}>
              <li className="glass-card card-glow rounded-xl p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
                    {CATEGORY_LABELS[c.category] ?? c.category}
                  </span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                  {c.body}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </li>
            </ScrollReveal>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.03]">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground/80">Nothing here yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Be the first to leave a confession, suggestion, or piece of feedback.
          </p>
        </div>
      )}
    </div>
  );
}
