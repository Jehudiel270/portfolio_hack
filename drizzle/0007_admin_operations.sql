CREATE TABLE IF NOT EXISTS portfolio_settings (
  key varchar(80) PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portfolio_activity_log (
  id serial PRIMARY KEY,
  action varchar(24) NOT NULL,
  resource varchar(80) NOT NULL,
  resource_id integer,
  summary varchar(240) NOT NULL,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_activity_log_created_at_idx
  ON portfolio_activity_log (created_at DESC);

CREATE TABLE IF NOT EXISTS portfolio_page_views (
  day varchar(10) NOT NULL,
  path varchar(120) NOT NULL,
  views integer NOT NULL DEFAULT 0,
  CONSTRAINT portfolio_page_views_day_path_unique UNIQUE (day, path)
);
