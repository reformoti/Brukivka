-- Additive migration: existing characters and their progress are preserved.
CREATE UNIQUE INDEX IF NOT EXISTS homow_username_unique ON homow_players (lower(username));
CREATE TABLE IF NOT EXISTS homow_passwords (
 user_id TEXT PRIMARY KEY REFERENCES homow_players(id),
 salt TEXT NOT NULL, password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS homow_sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES homow_players(id), expires_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS homow_sessions_expiry ON homow_sessions(expires_at);
