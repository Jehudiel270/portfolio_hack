CREATE TABLE IF NOT EXISTS portfolio_admins (
  id serial PRIMARY KEY,
  email varchar(320) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolio_profile (
  id integer PRIMARY KEY DEFAULT 1,
  name varchar(120) NOT NULL,
  role varchar(180) NOT NULL,
  location varchar(120) NOT NULL DEFAULT 'Bénin',
  education varchar(180) NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  avatar_url text,
  email varchar(320),
  github_url text,
  linkedin_url text,
  available boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id serial PRIMARY KEY,
  title varchar(160) NOT NULL,
  slug varchar(180) NOT NULL UNIQUE,
  description text NOT NULL,
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  demo_url text,
  repo_url text,
  image_url text,
  year varchar(12),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolio_journey (
  id serial PRIMARY KEY,
  role varchar(180) NOT NULL,
  organization varchar(180) NOT NULL,
  location varchar(120),
  start_date varchar(32) NOT NULL,
  end_date varchar(32),
  description text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS portfolio_achievements (
  id serial PRIMARY KEY,
  title varchar(180) NOT NULL,
  description text NOT NULL,
  date varchar(32),
  icon varchar(60) NOT NULL DEFAULT 'Sparkles',
  sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS portfolio_skills (
  id serial PRIMARY KEY,
  name varchar(120) NOT NULL,
  level integer NOT NULL DEFAULT 70,
  category varchar(80) NOT NULL DEFAULT 'Full Stack',
  sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS portfolio_technologies (
  id serial PRIMARY KEY,
  name varchar(100) NOT NULL,
  icon varchar(80) NOT NULL DEFAULT '',
  category varchar(80) NOT NULL DEFAULT 'Frontend',
  sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS portfolio_contact_messages (
  id serial PRIMARY KEY,
  name varchar(120) NOT NULL,
  email varchar(320) NOT NULL,
  subject varchar(180) NOT NULL DEFAULT '',
  message text NOT NULL,
  delivery_status varchar(30) NOT NULL DEFAULT 'received',
  created_at timestamptz NOT NULL DEFAULT now()
);
