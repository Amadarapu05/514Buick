-- Optional seed data for 514 Buick (run after 001_initial.sql)

INSERT INTO carousel_images (url, alt_text, sort_order) VALUES
  ('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1920&q=80', 'Living room', 0),
  ('https://images.unsplash.com/photo-1556912173-46c7d4c8b8b1?w=1920&q=80', 'Kitchen', 1),
  ('https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1920&q=80', 'Evening', 2),
  ('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1920&q=80', 'Gathering', 3)
ON CONFLICT DO NOTHING;

INSERT INTO birthdays (name, month, day) VALUES
  ('Sample Friend', 12, 25)
ON CONFLICT DO NOTHING;

-- Sample past event (hosts can create real ones via /admin)
INSERT INTO events (slug, title, description, location, starts_at, status, cover_image_url)
VALUES (
  'welcome-party',
  'Welcome Party',
  'Kick off the year at 514 Buick.',
  '514 Buick St',
  NOW() + INTERVAL '14 days',
  'published',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80'
)
ON CONFLICT (slug) DO NOTHING;
