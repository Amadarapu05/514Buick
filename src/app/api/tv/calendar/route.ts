import { NextResponse } from "next/server";

export async function GET() {
  const icalUrl = process.env.GOOGLE_CALENDAR_ICAL_URL;

  if (!icalUrl) {
    return NextResponse.json({
      events: [{ title: "Add GOOGLE_CALENDAR_ICAL_URL", time: "" }],
    });
  }

  try {
    const res = await fetch(icalUrl, { next: { revalidate: 300 } });
    const text = await res.text();
    const events = parseIcalSummary(text).slice(0, 5);
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ events: [] });
  }
}

function parseIcalSummary(ical: string): { title: string; time: string }[] {
  const events: { title: string; time: string }[] = [];
  const blocks = ical.split("BEGIN:VEVENT");

  for (const block of blocks.slice(1, 6)) {
    const summary = block.match(/SUMMARY:(.+)/)?.[1]?.trim();
    const dtstart = block.match(/DTSTART[^:]*:(\d{8})/)?.[1];
    if (summary) {
      const time = dtstart
        ? `${dtstart.slice(4, 6)}/${dtstart.slice(6, 8)}`
        : "";
      events.push({ title: summary.replace(/\\,/g, ","), time });
    }
  }

  return events;
}
