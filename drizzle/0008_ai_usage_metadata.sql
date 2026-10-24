ALTER TABLE portfolio_technologies
  ADD COLUMN IF NOT EXISTS ai_use_cases text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS ai_verified_at varchar(32);
