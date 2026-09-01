-- 514 Buick initial schema

CREATE TYPE user_role AS ENUM ('guest', 'host');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'past');
CREATE TYPE rsvp_status AS ENUM ('going', 'maybe', 'cancelled');
CREATE TYPE confession_category AS ENUM ('confession', 'feedback', 'suggestion');
CREATE TYPE queue_item_status AS ENUM ('pending', 'playing', 'played');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role user_role NOT NULL DEFAULT 'guest',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE carousel_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  status event_status NOT NULL DEFAULT 'draft',
  cover_image_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status rsvp_status NOT NULL DEFAULT 'going',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

CREATE TABLE confessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body TEXT NOT NULL,
  category confession_category NOT NULL DEFAULT 'confession',
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE birthdays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  day INT NOT NULL CHECK (day >= 1 AND day <= 31),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE spotify_tokens (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_track_id TEXT NOT NULL,
  track_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_art_url TEXT,
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  vote_score INT NOT NULL DEFAULT 0,
  status queue_item_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE queue_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id UUID NOT NULL REFERENCES queue_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  value INT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (queue_item_id, user_id)
);

CREATE INDEX idx_events_status_starts ON events(status, starts_at);
CREATE INDEX idx_rsvps_event ON rsvps(event_id);
CREATE INDEX idx_confessions_created ON confessions(created_at DESC);
CREATE INDEX idx_queue_pending ON queue_items(status, vote_score DESC);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  host_emails TEXT[];
  is_host BOOLEAN := FALSE;
BEGIN
  host_emails := string_to_array(coalesce(current_setting('app.host_emails', true), ''), ',');
  IF NEW.email = ANY(host_emails) OR NEW.email = ANY(
    SELECT unnest(host_emails) FROM (SELECT trim(unnest) AS e FROM unnest(host_emails)) t
  ) THEN
    is_host := TRUE;
  END IF;

  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    CASE WHEN is_host THEN 'host'::user_role ELSE 'guest'::user_role END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotify_tokens ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_host()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'host'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Carousel
CREATE POLICY "Carousel public read"
  ON carousel_images FOR SELECT USING (true);
CREATE POLICY "Carousel host write"
  ON carousel_images FOR ALL TO authenticated
  USING (public.is_host()) WITH CHECK (public.is_host());

-- Events
CREATE POLICY "Published events public read"
  ON events FOR SELECT USING (status = 'published' OR status = 'past' OR public.is_host());
CREATE POLICY "Events host write"
  ON events FOR ALL TO authenticated
  USING (public.is_host()) WITH CHECK (public.is_host());

-- Event images
CREATE POLICY "Event images follow events"
  ON event_images FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND (e.status IN ('published', 'past') OR public.is_host())
    )
  );
CREATE POLICY "Event images host write"
  ON event_images FOR ALL TO authenticated
  USING (public.is_host()) WITH CHECK (public.is_host());

-- RSVPs
CREATE POLICY "Users read own rsvps"
  ON rsvps FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_host());
CREATE POLICY "Users manage own rsvps"
  ON rsvps FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own rsvps"
  ON rsvps FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own rsvps"
  ON rsvps FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Confessions
CREATE POLICY "Public read visible confessions"
  ON confessions FOR SELECT USING (hidden = false OR public.is_host());
CREATE POLICY "Anyone can insert confessions"
  ON confessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Hosts moderate confessions"
  ON confessions FOR UPDATE TO authenticated
  USING (public.is_host()) WITH CHECK (public.is_host());
CREATE POLICY "Hosts delete confessions"
  ON confessions FOR DELETE TO authenticated USING (public.is_host());

-- Birthdays
CREATE POLICY "Birthdays public read"
  ON birthdays FOR SELECT USING (true);
CREATE POLICY "Birthdays host write"
  ON birthdays FOR ALL TO authenticated
  USING (public.is_host()) WITH CHECK (public.is_host());

-- Queue
CREATE POLICY "Queue public read"
  ON queue_items FOR SELECT USING (true);
CREATE POLICY "Authenticated add to queue"
  ON queue_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Hosts manage queue"
  ON queue_items FOR UPDATE TO authenticated USING (public.is_host());
CREATE POLICY "Hosts delete queue items"
  ON queue_items FOR DELETE TO authenticated USING (public.is_host());

CREATE POLICY "Votes read authenticated"
  ON queue_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own votes"
  ON queue_votes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Spotify tokens service only (no client policies)
CREATE POLICY "No direct spotify token access"
  ON spotify_tokens FOR ALL USING (false);

-- Seed carousel placeholders (optional - run after migration)
-- INSERT INTO carousel_images (url, alt_text, sort_order) VALUES ...
