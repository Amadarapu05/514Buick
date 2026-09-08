import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/** Apartment is in Boston — all event times are Eastern. */
export const APP_TIMEZONE = "America/New_York";

/** Format a stored UTC instant for display in Eastern Time. */
export function formatEventDate(
  iso: string | Date,
  pattern: string
): string {
  return formatInTimeZone(new Date(iso), APP_TIMEZONE, pattern);
}

/**
 * datetime-local value (no timezone) treated as Eastern Time → UTC ISO string.
 * e.g. "2026-09-11T22:00" (10pm ET) → "2026-09-12T02:00:00.000Z" during EDT
 */
export function easternLocalInputToIso(localValue: string): string {
  return fromZonedTime(localValue, APP_TIMEZONE).toISOString();
}

/**
 * UTC ISO → datetime-local string in Eastern Time (yyyy-MM-ddTHH:mm).
 */
export function isoToEasternLocalInput(iso: string): string {
  return formatInTimeZone(new Date(iso), APP_TIMEZONE, "yyyy-MM-dd'T'HH:mm");
}
