CREATE TABLE IF NOT EXISTS portfolio_educations (
  id serial PRIMARY KEY,
  title varchar(180) NOT NULL,
  institution varchar(180) NOT NULL,
  degree varchar(180) NOT NULL DEFAULT '',
  location varchar(120),
  start_date varchar(32) NOT NULL,
  end_date varchar(32),
  status varchar(20) NOT NULL DEFAULT 'completed',
  description text NOT NULL DEFAULT '',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS portfolio_certifications (
  id serial PRIMARY KEY,
  title varchar(180) NOT NULL,
  issuer varchar(180) NOT NULL,
  issued_at varchar(32),
  expires_at varchar(32),
  credential_id varchar(180),
  credential_url text,
  skills text[] NOT NULL DEFAULT ARRAY[]::text[],
  description text NOT NULL DEFAULT '',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0
);
