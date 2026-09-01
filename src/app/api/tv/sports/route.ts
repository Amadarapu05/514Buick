import { NextResponse } from "next/server";
import {
  dedupeStreams,
  formatScore,
  formatStatus,
  isEventOnDate,
  isLiveStatus,
  mergeEventsById,
  sortEventsForDisplay,
  todayInTimeZone,
  US_PRO_LEAGUES,
  type SportsDbEvent,
  type TvStream,
} from "@/lib/sports";

const API = "https://www.thesportsdb.com/api/v1/json/3";
const MAX_GAMES_PER_LEAGUE = 8;

export interface SportsGameResponse {
  home: string;
  away: string;
  homeBadge: string | null;
  awayBadge: string | null;
  score: string | null;
  status: string;
  isLive: boolean;
  league: string;
  streams: TvStream[];
}

export interface SportsLeagueSection {
  league: string;
  games: SportsGameResponse[];
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

async function fetchTvStreams(eventId: string): Promise<TvStream[]> {
  const data = await fetchJson<{
    tvevent?: { strChannel?: string; strCountry?: string; strLogo?: string }[];
  }>(`${API}/lookuptv.php?id=${eventId}`);
  return dedupeStreams(data?.tvevent ?? []);
}

function toGame(event: SportsDbEvent, streams: TvStream[]): SportsGameResponse {
  const live = isLiveStatus(event.strStatus);
  return {
    home: event.strHomeTeam ?? "Home",
    away: event.strAwayTeam ?? "Away",
    homeBadge: event.strHomeTeamBadge?.trim() || null,
    awayBadge: event.strAwayTeamBadge?.trim() || null,
    score: formatScore(event, live),
    status: formatStatus(event, live),
    isLive: live,
    league: event.strLeague ?? "",
    streams: live ? streams : [],
  };
}

async function fetchEventsDayByLeagueId(
  leagueId: string,
  date: string
): Promise<SportsDbEvent[]> {
  const data = await fetchJson<{ events?: SportsDbEvent[] }>(
    `${API}/eventsday.php?d=${date}&l=${leagueId}`
  );
  return data?.events ?? [];
}

async function fetchEventsDayBySport(
  sport: string,
  leagueName: string,
  date: string
): Promise<SportsDbEvent[]> {
  const data = await fetchJson<{ events?: SportsDbEvent[] }>(
    `${API}/eventsday.php?d=${date}&s=${encodeURIComponent(sport)}`
  );
  return (data?.events ?? []).filter(
    (e) => (e.strLeague ?? "").toLowerCase() === leagueName.toLowerCase()
  );
}

/** next/past league endpoints sometimes list today when eventsday by sport does not */
async function fetchLeagueBookends(
  leagueId: string,
  date: string
): Promise<SportsDbEvent[]> {
  const [nextData, pastData] = await Promise.all([
    fetchJson<{ events?: SportsDbEvent[] }>(
      `${API}/eventsnextleague.php?id=${leagueId}`
    ),
    fetchJson<{ events?: SportsDbEvent[] }>(
      `${API}/eventspastleague.php?id=${leagueId}`
    ),
  ]);

  const bookends = [
    ...(nextData?.events ?? []),
    ...(pastData?.events ?? []),
  ];
  return bookends.filter((e) => isEventOnDate(e, date));
}

async function fetchLeagueGamesToday(
  leagueId: string,
  sport: string,
  leagueName: string,
  date: string
): Promise<SportsDbEvent[]> {
  const [byLeagueId, bySport, bookends] = await Promise.all([
    fetchEventsDayByLeagueId(leagueId, date),
    fetchEventsDayBySport(sport, leagueName, date),
    fetchLeagueBookends(leagueId, date),
  ]);

  return sortEventsForDisplay(
    mergeEventsById(byLeagueId, bySport, bookends)
  ).slice(0, MAX_GAMES_PER_LEAGUE);
}

export async function GET() {
  const date = todayInTimeZone();
  const leagues: SportsLeagueSection[] = [];

  await Promise.all(
    US_PRO_LEAGUES.map(async ({ label, sport, league, leagueId }) => {
      const events = await fetchLeagueGamesToday(
        leagueId,
        sport,
        league,
        date
      );
      const games: SportsGameResponse[] = [];

      for (const event of events) {
        const streams =
          event.idEvent && isLiveStatus(event.strStatus)
            ? await fetchTvStreams(event.idEvent)
            : [];
        games.push(toGame(event, streams));
      }

      leagues.push({ league: label, games });
    })
  );

  leagues.sort((a, b) => {
    const ai = US_PRO_LEAGUES.findIndex((l) => l.label === a.league);
    const bi = US_PRO_LEAGUES.findIndex((l) => l.label === b.league);
    return ai - bi;
  });

  return NextResponse.json({ date, leagues });
}
