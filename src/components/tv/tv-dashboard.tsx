"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { cn, VENUE_ADDRESS } from "@/lib/utils";

const ROTATE_MS = 10000;

type WidgetId = "weather" | "birthdays" | "countdown" | "sports" | "music";

const WIDGETS: WidgetId[] = [
  "weather",
  "birthdays",
  "countdown",
  "sports",
  "music",
];

interface WeatherData {
  temp: number | null;
  description: string;
  city: string;
}

interface BirthdayEntry {
  name: string;
  month: number;
  day: number;
  dateLabel: string;
  turningAge: number | null;
  ageLabel: string | null;
  birthdayPhrase: string | null;
  daysUntil: number;
  hoursUntil: number;
  minutesUntil: number;
}

interface BirthdayData {
  today: BirthdayEntry[];
  next: BirthdayEntry | null;
  thisWeek: BirthdayEntry[];
}

interface CountdownData {
  event: {
    title: string;
    location: string | null;
    days: number;
    hours: number;
    minutes: number;
  } | null;
}

interface SportsStream {
  channel: string;
  country: string;
  logo: string | null;
}

interface SportsGame {
  home: string;
  away: string;
  homeBadge: string | null;
  awayBadge: string | null;
  score: string | null;
  status: string;
  isLive: boolean;
  league: string | null;
  streams: SportsStream[];
}

interface SportsLeagueSection {
  league: string;
  games: SportsGame[];
}

interface SportsData {
  date?: string;
  leagues: SportsLeagueSection[];
}

interface MusicData {
  playing: boolean;
  track: { name: string; artist: string; albumArt?: string } | null;
  queue: { name: string }[];
}

export function TvDashboard({ speed }: { speed?: string }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [birthdays, setBirthdays] = useState<BirthdayData | null>(null);
  const [countdown, setCountdown] = useState<CountdownData | null>(null);
  const [sports, setSports] = useState<SportsData | null>(null);
  const [music, setMusic] = useState<MusicData | null>(null);

  const interval = speed === "fast" ? 5000 : speed === "slow" ? 60000 : ROTATE_MS;

  const fetchAll = useCallback(async () => {
    const [w, b, cd, s] = await Promise.all([
      fetch("/api/tv/weather").then((r) => r.json()),
      fetch("/api/tv/birthdays").then((r) => r.json()),
      fetch("/api/tv/countdown").then((r) => r.json()),
      fetch("/api/tv/sports").then((r) => r.json()),
    ]);
    setWeather(w);
    setBirthdays(b);
    setCountdown(cd);
    setSports(s);

    const [np, q] = await Promise.all([
      fetch("/api/spotify/now-playing").then((r) => r.json()).catch(() => null),
      fetch("/api/spotify/queue").then((r) => r.json()).catch(() => ({ items: [] })),
    ]);
    setMusic({
      playing: np?.playing,
      track: np?.track ?? null,
      queue: (q?.items ?? []).slice(0, 3),
    });
  }, []);

  useEffect(() => {
    fetchAll();
    const refresh = setInterval(fetchAll, 30000);
    return () => clearInterval(refresh);
  }, [fetchAll]);

  useEffect(() => {
    if (WIDGETS[index] !== "music") return;
    const poll = setInterval(async () => {
      const np = await fetch("/api/spotify/now-playing")
        .then((r) => r.json())
        .catch(() => null);
      const q = await fetch("/api/spotify/queue")
        .then((r) => r.json())
        .catch(() => ({ items: [] }));
      setMusic({
        playing: np?.playing,
        track: np?.track ?? null,
        queue: (q?.items ?? []).slice(0, 3),
      });
    }, 5000);
    return () => clearInterval(poll);
  }, [index]);

  useEffect(() => {
    const rotate = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % WIDGETS.length);
        setVisible(true);
      }, 800);
    }, interval);
    return () => clearInterval(rotate);
  }, [interval]);

  useEffect(() => {
    function onVisibility() {
      if (document.hidden) return;
      fetchAll();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [fetchAll]);

  const current = WIDGETS[index];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-8 text-white">
      <a href="/" className="absolute left-6 top-6 font-display text-2xl text-white/40 transition-colors hover:text-white/80">
        514 Buick
      </a>
      <div
        className={cn(
          "w-full max-w-4xl text-center transition-opacity duration-700",
          visible ? "opacity-100" : "opacity-0"
        )}
      >
        {current === "weather" && (
          <Widget title="Weather">
            <p className="text-8xl font-light">{weather?.temp ?? "—"}°</p>
            <p className="mt-4 text-2xl capitalize text-white/70">
              {weather?.description}
            </p>
            <p className="mt-2 text-xl text-white/50">{weather?.city}</p>
          </Widget>
        )}
        {current === "birthdays" && (
          <Widget title="Birthdays">
            {birthdays?.today && birthdays.today.length > 0 ? (
              <ul className="space-y-6">
                {birthdays.today.map((b) => (
                  <li key={b.name}>
                    <p className="text-4xl">🎂 {b.name}</p>
                    {b.birthdayPhrase ? (
                      <p className="mt-2 text-2xl text-accent">{b.birthdayPhrase}!</p>
                    ) : (
                      <p className="mt-2 text-2xl text-white/60">Birthday today!</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : birthdays?.next ? (
              <div>
                <p className="text-4xl font-display">{birthdays.next.name}</p>
                {birthdays.next.birthdayPhrase ? (
                  <p className="mt-4 text-3xl text-accent">
                    {birthdays.next.birthdayPhrase} coming up
                  </p>
                ) : (
                  <p className="mt-4 text-2xl text-white/60">
                    Birthday on {birthdays.next.dateLabel}
                  </p>
                )}
                <p className="mt-8 text-6xl font-light tabular-nums">
                  {birthdays.next.daysUntil}d {birthdays.next.hoursUntil}h{" "}
                  {birthdays.next.minutesUntil}m
                </p>
                <p className="mt-4 text-xl text-white/50">
                  until {birthdays.next.dateLabel}
                </p>
              </div>
            ) : (
              <p className="text-2xl text-white/50">No birthdays on file</p>
            )}
            {birthdays?.thisWeek && birthdays.thisWeek.length > 0 && (
              <ul className="mt-10 space-y-3 text-left text-xl text-white/70">
                <li className="text-sm uppercase tracking-widest text-white/40">
                  Also this week
                </li>
                {birthdays.thisWeek.map((b) => (
                  <li key={`${b.name}-${b.month}-${b.day}`}>
                    <span className="font-medium">{b.name}</span>
                    <span className="text-white/50">
                      {" "}
                      · {b.dateLabel}
                      {b.birthdayPhrase
                        ? ` · ${b.birthdayPhrase}`
                        : ` · in ${b.daysUntil}d`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Widget>
        )}
        {current === "countdown" && (
          <Widget title="Next event">
            {countdown?.event ? (
              <>
                <p className="text-4xl font-display">{countdown.event.title}</p>
                <p className="mt-8 text-7xl font-light tabular-nums">
                  {countdown.event.days}d {countdown.event.hours}h{" "}
                  {countdown.event.minutes}m
                </p>
                <p className="mt-4 text-xl text-white/50">{VENUE_ADDRESS}</p>
              </>
            ) : (
              <p className="text-2xl text-white/50">No upcoming events</p>
            )}
          </Widget>
        )}
        {current === "sports" && (
          <Widget title="Sports today">
            {sports?.date && (
              <p className="mb-8 text-center text-sm text-white/40">
                {sports.date} · Eastern
              </p>
            )}
            <ul className="space-y-10 text-left">
              {sports?.leagues?.map((section) => (
                <li key={section.league}>
                  <p className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-accent">
                    {section.league}
                  </p>
                  {section.games.length === 0 ? (
                    <p className="text-center text-xl text-white/50">No games today</p>
                  ) : (
                    <ul className="space-y-8">
                      {section.games.map((g, i) => (
                        <li key={`${section.league}-${g.away}-${g.home}-${i}`}>
                          <SportsMatchup game={g} />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </Widget>
        )}
        {current === "music" && (
          <Widget title="Now playing">
            {music?.track ? (
              <div className="flex flex-col items-center gap-6">
                {music.track.albumArt && (
                  <Image
                    src={music.track.albumArt}
                    alt=""
                    width={280}
                    height={280}
                    className="rounded-lg shadow-2xl shadow-black/50"
                    priority
                  />
                )}
                <div>
                  <p className="text-4xl">{music.track.name}</p>
                  <p className="mt-2 text-2xl text-white/60">{music.track.artist}</p>
                </div>
              </div>
            ) : (
              <p className="text-2xl text-white/50">Nothing playing</p>
            )}
            {music?.queue && music.queue.length > 0 && (
              <ul className="mt-10 space-y-2 text-left text-xl text-white/60">
                <li className="text-white/30">Up next</li>
                {music.queue.map((q, i) => (
                  <li key={i}>{q.name}</li>
                ))}
              </ul>
            )}
          </Widget>
        )}
      </div>
      <div className="absolute bottom-6 flex gap-2">
        {WIDGETS.map((w, i) => (
          <span
            key={w}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index ? "w-8 bg-accent" : "w-1.5 bg-white/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function SportsMatchup({ game: g }: { game: SportsGame }) {
  return (
    <>
      <div className="flex items-center justify-center gap-4 sm:gap-8">
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          <TeamBadge url={g.awayBadge} name={g.away} />
          <span className="truncate text-right text-2xl font-medium sm:text-3xl">
            {g.away}
          </span>
        </div>
        <div className="shrink-0 text-center">
          {g.isLive && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-red-400">
              Live
            </p>
          )}
          {g.score ? (
            <p className="text-4xl font-light tabular-nums sm:text-5xl">{g.score}</p>
          ) : (
            <p className="text-2xl text-white/40">vs</p>
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="truncate text-2xl font-medium sm:text-3xl">{g.home}</span>
          <TeamBadge url={g.homeBadge} name={g.home} />
        </div>
      </div>
      <p className="mt-3 text-center text-lg text-white/50">{g.status}</p>
      {g.isLive && g.streams.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-center text-sm uppercase tracking-widest text-accent">
            Watch on
          </p>
          <ul className="flex flex-wrap justify-center gap-2">
            {g.streams.map((s) => (
              <li
                key={s.channel}
                className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/90"
              >
                {s.logo && (
                  <Image
                    src={s.logo}
                    alt=""
                    width={22}
                    height={22}
                    className="rounded-sm object-contain"
                  />
                )}
                <span>{s.channel}</span>
                {s.country && (
                  <span className="text-white/40">· {s.country}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function TeamBadge({ url, name }: { url: string | null; name: string }) {
  if (!url) {
    return (
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-semibold text-white/60 sm:h-16 sm:w-16"
        aria-hidden
      >
        {name.charAt(0)}
      </span>
    );
  }
  return (
    <Image
      src={url}
      alt=""
      width={64}
      height={64}
      className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16"
    />
  );
}

function Widget({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <p className="mb-8 text-sm font-medium uppercase tracking-[0.3em] text-accent">
        {title}
      </p>
      {children}
    </>
  );
}
