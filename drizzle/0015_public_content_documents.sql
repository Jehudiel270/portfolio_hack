ALTER TABLE portfolio_journey
  ADD COLUMN IF NOT EXISTS document_url text;

ALTER TABLE portfolio_educations
  ADD COLUMN IF NOT EXISTS document_url text;

ALTER TABLE portfolio_certifications
  ADD COLUMN IF NOT EXISTS document_url text;
