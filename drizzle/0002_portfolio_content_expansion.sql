ALTER TABLE portfolio_skills
  ADD COLUMN IF NOT EXISTS icon varchar(120) NOT NULL DEFAULT '';

ALTER TABLE portfolio_projects
  ADD COLUMN IF NOT EXISTS case_role varchar(180),
  ADD COLUMN IF NOT EXISTS case_context text,
  ADD COLUMN IF NOT EXISTS responsibilities text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS outcomes text,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS publication_status varchar(20) NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS publish_at timestamptz;

ALTER TABLE portfolio_journey
  ADD COLUMN IF NOT EXISTS image_url text;

ALTER TABLE portfolio_contact_messages
  ADD COLUMN IF NOT EXISTS processing_status varchar(20) NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;
