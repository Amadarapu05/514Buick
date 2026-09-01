-- Allow anyone to view RSVP names/status on published or past events
CREATE POLICY "Public read rsvps on published events"
  ON rsvps FOR SELECT
  USING (
    status IN ('going', 'maybe')
    AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = rsvps.event_id
        AND e.status IN ('published', 'past')
    )
  );

CREATE POLICY "Public read names for event rsvps"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rsvps r
      INNER JOIN events e ON e.id = r.event_id
      WHERE r.user_id = profiles.id
        AND r.status IN ('going', 'maybe')
        AND e.status IN ('published', 'past')
    )
  );
