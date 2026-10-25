ALTER TABLE portfolio_admins ADD COLUMN IF NOT EXISTS totp_secret_ciphertext text;
ALTER TABLE portfolio_admins ADD COLUMN IF NOT EXISTS totp_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE portfolio_admins ADD COLUMN IF NOT EXISTS recovery_code_hashes jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE TABLE IF NOT EXISTS portfolio_admin_login_attempts (
  ip_hash varchar(64) PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now()
);
