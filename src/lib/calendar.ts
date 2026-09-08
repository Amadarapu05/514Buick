import { format } from "date-fns";
import { VENUE_ADDRESS } from "@/lib/utils";
import { getAppOrigin } from "@/lib/spotify/redirect";

/** Google Calendar template URL (UTC times as YYYYMMDDTHHmmssZ). */
function toGCalUtc(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export function getEventPageUrl(slug: string): string {
  return `${getAppOrigin()}/events/${slug}`;
}

export function getGoogleCalendarUrl(event: {
  title: string;
  slug: string;
  description?: string | null;
  starts_at: string;
  ends_at?: string | null;
}): string {
  const start = new Date(event.starts_at);
  const end = event.ends_at
    ? new Date(event.ends_at)
    : new Date(start.getTime() + 3 * 60 * 60 * 1000);

  const details = [
    event.description?.trim() || "",
    `More info: ${getEventPageUrl(event.slug)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toGCalUtc(start)}/${toGCalUtc(end)}`,
    details,
    location: VENUE_ADDRESS,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function formatEventWhen(startsAt: string): string {
  return format(new Date(startsAt), "EEE, MMM d · h:mm a");
}

export function buildRsvpConfirmationSms(event: {
  title: string;
  slug: string;
  description?: string | null;
  starts_at: string;
  ends_at?: string | null;
  status: "going" | "maybe";
}): string {
  const when = formatEventWhen(event.starts_at);
  const eventUrl = getEventPageUrl(event.slug);
  const calUrl = getGoogleCalendarUrl(event);
  const headline =
    event.status === "maybe"
      ? `514 Buick — You're a maybe for ${event.title}`
      : `514 Buick — You're on the list for ${event.title}`;

  return `${headline}
${when}
${VENUE_ADDRESS}

Event: ${eventUrl}
Add to calendar: ${calUrl}

Reply STOP to opt out, HELP for help.`;
}
