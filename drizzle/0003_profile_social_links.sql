ALTER TABLE portfolio_profile
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '[]'::jsonb;
