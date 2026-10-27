CREATE TABLE IF NOT EXISTS portfolio_ai_provider_credentials (
  provider varchar(24) PRIMARY KEY,
  encrypted_key text NOT NULL,
  model varchar(120) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portfolio_ai_provider_usage (
  day varchar(10) NOT NULL,
  provider varchar(24) NOT NULL,
  requests integer NOT NULL DEFAULT 0,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  CONSTRAINT portfolio_ai_provider_usage_daily_unique UNIQUE (day, provider)
);

CREATE TABLE IF NOT EXISTS portfolio_analytics_events (
  day varchar(10) NOT NULL,
  path varchar(120) NOT NULL,
  event varchar(40) NOT NULL,
  source varchar(40) NOT NULL DEFAULT 'direct',
  device varchar(16) NOT NULL DEFAULT 'unknown',
  count integer NOT NULL DEFAULT 0,
  CONSTRAINT portfolio_analytics_events_daily_unique UNIQUE (day, path, event, source, device)
);
