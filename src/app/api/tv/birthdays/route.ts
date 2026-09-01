import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  formatAgeLabel,
  formatBirthdayDate,
  getNextBirthdayDate,
  isBirthdayToday,
  msUntilBirthday,
  turningAgeOnDate,
  type BirthdayRow,
} from "@/lib/birthdays";

function enrich(b: BirthdayRow & { id?: string }) {
  const now = new Date();
  const today = isBirthdayToday(b.month, b.day, now);
  const nextDate = getNextBirthdayDate(b.month, b.day, now);
  const { days, hours, minutes } = msUntilBirthday(b.month, b.day, now);
  const turningAge =
    b.birth_year != null ? turningAgeOnDate(b.birth_year, nextDate) : null;
  const ageLabel =
    turningAge != null ? formatAgeLabel(turningAge) : null;

  return {
    name: b.name,
    month: b.month,
    day: b.day,
    birth_year: b.birth_year,
    today,
    daysUntil: today ? 0 : days,
    hoursUntil: today ? 0 : hours,
    minutesUntil: today ? 0 : minutes,
    dateLabel: formatBirthdayDate(b.month, b.day),
    turningAge,
    ageLabel,
    birthdayPhrase:
      ageLabel != null
        ? `${ageLabel} birthday${today ? " today" : ""}`
        : null,
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("birthdays")
    .select("*")
    .order("month")
    .order("day");

  const rows = (data ?? []) as (BirthdayRow & {
    id: string;
    birth_year?: number | null;
  })[];
  const enriched = rows.map((b) =>
    enrich({ ...b, birth_year: b.birth_year ?? null })
  );

  const today = enriched.filter((b) => b.today);

  const upcoming = enriched
    .filter((b) => !b.today)
    .sort((a, b) => {
      if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
      if (a.hoursUntil !== b.hoursUntil) return a.hoursUntil - b.hoursUntil;
      return a.minutesUntil - b.minutesUntil;
    });

  const next = upcoming[0] ?? null;

  const thisWeek = upcoming
    .slice(1)
    .filter((b) => b.daysUntil <= 7);

  return NextResponse.json({ today, next, thisWeek });
}
