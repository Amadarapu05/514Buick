<<<<<<< HEAD
# 514 Buick

Apartment website for 514 Buick Street — events, RSVP, music queue, TV dashboard, and anonymous confessions.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Supabase** — auth, Postgres, RLS
- **Spotify Web API** — apartment queue (Premium account required)
- **OpenWeatherMap** — TV weather widget (optional)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL in [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql) in the SQL Editor.
3. Copy project URL and keys to `.env.local` (see [`.env.example`](.env.example)).

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in Supabase keys and `HOST_EMAILS` (your roommate emails).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — 514 Buick title + photo carousel |
| `/events` | Upcoming & past events |
| `/events/[slug]` | Event detail + RSVP (login required) |
| `/music` | Apartment queue — search, vote, now playing |
| `/tv` | Full-screen TV dashboard (no navbar) |
| `/confessions` | Anonymous confessions & feedback |
| `/admin` | Host tools (events, confessions, birthdays, carousel) |

## Spotify (music queue)

1. Create a [Spotify Developer app](https://developer.spotify.com/dashboard).
2. Add redirect URI: `http://localhost:3000/api/spotify/callback` (and production URL).
3. Set `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `NEXT_PUBLIC_SPOTIFY_CLIENT_ID`.
4. As a **host**, visit `/music` and click **Connect Spotify** (apartment Premium account).
5. Start playback once on the apartment speaker from the Spotify app so the API can control it.

## TV dashboard

Bookmark `/tv` on your smart TV browser. Optional query: `?speed=fast` or `?speed=slow`.

Configure in `.env.local`:

- `OPENWEATHER_API_KEY`, `WEATHER_LAT`, `WEATHER_LON`
- `GOOGLE_CALENDAR_ICAL_URL` — public iCal feed from Google Calendar
- TV sports widget loads today’s NBA, NFL, NHL, and MLB games automatically via [TheSportsDB](https://www.thesportsdb.com/) (no env vars needed)

Add birthdays under **Admin → Birthdays**.

## Deploy (Vercel)

1. Push to GitHub and import in [Vercel](https://vercel.com).
2. Add all env vars from `.env.example`.
3. Set Supabase auth redirect URL: `https://your-domain.com/api/auth/callback`
4. Set Spotify redirect: `https://your-domain.com/api/spotify/callback`

## Seed sample data (optional)

After migration, in Supabase SQL Editor:

```sql
INSERT INTO carousel_images (url, alt_text, sort_order) VALUES
  ('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1920&q=80', 'Living room', 0),
  ('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1920&q=80', 'Party', 1);

INSERT INTO birthdays (name, month, day) VALUES ('Roommate', 1, 15);
```
=======
# 514Buick
514Buick Apartment Website
>>>>>>> 01e68a50728efca8f903a7785647762a8aaa84f4
