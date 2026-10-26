ALTER TABLE portfolio_projects
  ADD COLUMN IF NOT EXISTS metrics jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS case_layout jsonb;
