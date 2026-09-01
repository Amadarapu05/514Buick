export interface SportsDbEvent {
  idEvent?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
  intHomeScore?: string | number | null;
  intAwayScore?: string | number | null;
  strStatus?: string;
  strProgress?: string;
  dateEvent?: string;
  strTime?: string;
  strLeague?: string;
  strSport?: string;
}

export interface TvStream {
  channel: string;
  country: string;
  logo: string | null;
}

/** US pro leagues — TheSportsDB league IDs for eventsday.php?l= */
export const US_PRO_LEAGUES = [
  { label: "NBA", sport: "Basketball", league: "NBA", leagueId: "4387" },
  { label: "NFL", sport: "American Football", league: "NFL", leagueId: "4391" },
  { label: "NHL", sport: "Ice Hockey", league: "NHL", leagueId: "4380" },
  { label: "MLB", sport: "Baseball", league: "MLB", leagueId: "4424" },
] as const;

export function todayInTimeZone(timeZone = "America/New_York"): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

/** Live first, then upcoming by time, then finished. */
export function mergeEventsById(...lists: SportsDbEvent[][]): SportsDbEvent[] {
  const byId = new Map<string, SportsDbEvent>();
  for (const list of lists) {
    for (const event of list) {
      const key = event.idEvent ?? `${event.strHomeTeam}-${event.strAwayTeam}-${event.dateEvent}`;
      if (!byId.has(key)) byId.set(key, event);
    }
  }
  return [...byId.values()];
}

export function isEventOnDate(event: SportsDbEvent, date: string): boolean {
  return (event.dateEvent ?? "").slice(0, 10) === date;
}

export function sortEventsForDisplay(events: SportsDbEvent[]): SportsDbEvent[] {
  return [...events].sort((a, b) => {
    const aLive = isLiveStatus(a.strStatus) ? 0 : 1;
    const bLive = isLiveStatus(b.strStatus) ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;

    const aFinished = FINISHED.has((a.strStatus ?? "").toLowerCase()) ? 1 : 0;
    const bFinished = FINISHED.has((b.strStatus ?? "").toLowerCase()) ? 1 : 0;
    if (aFinished !== bFinished) return aFinished - bFinished;

    return (a.strTime ?? "").localeCompare(b.strTime ?? "");
  });
}

const FINISHED = new Set([
  "ft",
  "ft-aet",
  "ft-ps",
  "aet",
  "aot",
  "ao",
  "full time",
  "match finished",
  "finished",
  "after penalties",
  "awarded",
]);

const NOT_STARTED = new Set([
  "ns",
  "not started",
  "scheduled",
  "upcoming",
  "postponed",
  "pst",
  "canc",
  "cancelled",
  "abandoned",
]);

export function isLiveStatus(status: string | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase().trim();
  if (FINISHED.has(s) || NOT_STARTED.has(s)) return false;
  if (
    [
      "ht",
      "1h",
      "2h",
      "q1",
      "q2",
      "q3",
      "q4",
      "ot",
      "et",
      "pen",
      "live",
      "int",
      "in progress",
      "playing",
    ].includes(s)
  ) {
    return true;
  }
  if (/^\d/.test(s) || s.includes("'") || s.includes("+")) return true;
  return false;
}

export function isEventToday(dateEvent: string | undefined): boolean {
  if (!dateEvent) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dateEvent.slice(0, 10) === today;
}

export function hasScore(event: SportsDbEvent): boolean {
  const h = event.intHomeScore;
  const a = event.intAwayScore;
  return (
    h !== null &&
    h !== undefined &&
    h !== "" &&
    a !== null &&
    a !== undefined &&
    a !== ""
  );
}

export function formatScore(event: SportsDbEvent, live: boolean): string | null {
  if (hasScore(event)) {
    return `${event.intHomeScore} – ${event.intAwayScore}`;
  }
  if (live) return "0 – 0";
  return null;
}

export function formatStatus(event: SportsDbEvent, live: boolean): string {
  if (live && event.strProgress) return event.strProgress;
  if (live) return event.strStatus ?? "Live";
  if (event.strStatus === "NS" || event.strStatus === "Not Started") {
    const time = event.strTime?.slice(0, 5);
    return time ? `Starts ${time}` : "Upcoming";
  }
  return event.strStatus ?? event.dateEvent ?? "";
}

/** Prefer live today, then any live, then next/upcoming, then last result. */
export function pickTeamEvent(
  last: SportsDbEvent | null | undefined,
  next: SportsDbEvent | null | undefined
): SportsDbEvent | null {
  const candidates = [last, next].filter(Boolean) as SportsDbEvent[];

  for (const e of candidates) {
    if (isLiveStatus(e.strStatus) && isEventToday(e.dateEvent)) return e;
  }
  for (const e of candidates) {
    if (isLiveStatus(e.strStatus)) return e;
  }
  if (next?.idEvent) return next;
  if (last?.idEvent) return last;
  return null;
}

export function dedupeStreams(
  rows: {
    strChannel?: string;
    strCountry?: string;
    strLogo?: string;
  }[]
): TvStream[] {
  const seen = new Set<string>();
  const us: TvStream[] = [];
  const other: TvStream[] = [];

  for (const row of rows) {
    const channel = row.strChannel?.trim();
    if (!channel) continue;
    const key = channel.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const entry: TvStream = {
      channel,
      country: row.strCountry?.trim() ?? "",
      logo: row.strLogo?.trim() || null,
    };

    const country = entry.country.toLowerCase();
    if (country === "united states" || country === "usa" || country === "us") {
      us.push(entry);
    } else {
      other.push(entry);
    }
  }

  return [...us, ...other].slice(0, 8);
}
