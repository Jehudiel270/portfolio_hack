ALTER TABLE portfolio_admins
  ADD COLUMN IF NOT EXISTS display_name varchar(120) NOT NULL DEFAULT '';

UPDATE portfolio_admins
SET display_name = initcap(
  regexp_replace(split_part(split_part(email, '@', 1), '+', 1), '[._-]+', ' ', 'g')
)
WHERE display_name = '';
