-- Guest RSVPs: name + phone (no account required)

ALTER TABLE rsvps
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE rsvps
  ADD COLUMN IF NOT EXISTS guest_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE rsvps
  DROP CONSTRAINT IF EXISTS rsvps_event_id_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS rsvps_event_user_unique
  ON rsvps (event_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS rsvps_event_phone_unique
  ON rsvps (event_id, phone)
  WHERE phone IS NOT NULL;

-- Optional notes still ok; guest rows must have name + phone
ALTER TABLE rsvps
  DROP CONSTRAINT IF EXISTS rsvps_guest_or_user_check;

ALTER TABLE rsvps
  ADD CONSTRAINT rsvps_guest_or_user_check
  CHECK (
    (user_id IS NOT NULL)
    OR (guest_name IS NOT NULL AND phone IS NOT NULL)
  );

-- Allow anonymous inserts for guest RSVPs (API also uses service role)
DROP POLICY IF EXISTS "Anyone can insert guest rsvps" ON rsvps;
CREATE POLICY "Anyone can insert guest rsvps"
  ON rsvps FOR INSERT
  WITH CHECK (
    guest_name IS NOT NULL
    AND phone IS NOT NULL
    AND user_id IS NULL
  );

DROP POLICY IF EXISTS "Anyone can update guest rsvps" ON rsvps;
CREATE POLICY "Anyone can update guest rsvps"
  ON rsvps FOR UPDATE
  USING (guest_name IS NOT NULL AND phone IS NOT NULL)
  WITH CHECK (guest_name IS NOT NULL AND phone IS NOT NULL);
