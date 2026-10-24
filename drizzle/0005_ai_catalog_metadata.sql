ALTER TABLE portfolio_technologies
  ADD COLUMN IF NOT EXISTS ai_type varchar(24),
  ADD COLUMN IF NOT EXISTS ai_provider_id integer REFERENCES portfolio_technologies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ai_access_mode varchar(20),
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS official_url text;
