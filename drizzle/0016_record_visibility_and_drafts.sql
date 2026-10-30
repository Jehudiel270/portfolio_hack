ALTER TABLE portfolio_journey
  ADD COLUMN IF NOT EXISTS document_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS publication_status varchar(20) NOT NULL DEFAULT 'published';

ALTER TABLE portfolio_educations
  ADD COLUMN IF NOT EXISTS document_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS publication_status varchar(20) NOT NULL DEFAULT 'published';

ALTER TABLE portfolio_certifications
  ADD COLUMN IF NOT EXISTS document_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS publication_status varchar(20) NOT NULL DEFAULT 'published';
