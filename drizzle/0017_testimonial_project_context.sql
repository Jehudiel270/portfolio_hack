ALTER TABLE portfolio_testimonials
  ADD COLUMN IF NOT EXISTS project_id integer REFERENCES portfolio_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS received_at varchar(32);
