ALTER TABLE portfolio_projects
  ADD COLUMN IF NOT EXISTS project_type varchar(60) NOT NULL DEFAULT 'Web';

CREATE TABLE IF NOT EXISTS portfolio_testimonials (
  id serial PRIMARY KEY,
  author varchar(140) NOT NULL,
  role varchar(180),
  organization varchar(180),
  quote text NOT NULL,
  permission_confirmed boolean NOT NULL DEFAULT false,
  publication_status varchar(20) NOT NULL DEFAULT 'draft',
  sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS portfolio_testimonials_sort_order_idx
  ON portfolio_testimonials (sort_order);
