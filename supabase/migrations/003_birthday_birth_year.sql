ALTER TABLE birthdays
  ADD COLUMN IF NOT EXISTS birth_year INT CHECK (birth_year >= 1900 AND birth_year <= 2100);
