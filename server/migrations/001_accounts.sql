CREATE TABLE users (
 id TEXT PRIMARY KEY,
 username TEXT NOT NULL,
 username_key TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE TABLE sessions (
 token_hash TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 csrf_token TEXT NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE TABLE game_saves (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 snapshot TEXT NOT NULL,
 revision INTEGER NOT NULL,
 last_write_id TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
