-- SxS The Unreal / Unreal Guild user + guild roster schema for Cloudflare D1

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  tier INTEGER NOT NULL DEFAULT 4,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS guild_ranks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL UNIQUE,
  requires_verification INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  ingame_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('guild_member','user')) DEFAULT 'guild_member',
  status TEXT NOT NULL CHECK (status IN ('active','suspended')) DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login TEXT
);

CREATE TABLE IF NOT EXISTS guild_members (
  user_id TEXT PRIMARY KEY,
  class_id INTEGER NOT NULL,
  rank_id INTEGER NOT NULL,
  rank_verified INTEGER NOT NULL DEFAULT 0,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (rank_id) REFERENCES guild_ranks(id)
);

CREATE TABLE IF NOT EXISTS rank_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  requested_rank_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','denied','auto_approved')) DEFAULT 'pending',
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  resolved_by TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_rank_id) REFERENCES guild_ranks(id)
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_guild_members_rank ON guild_members(rank_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_class ON guild_members(class_id);

INSERT OR IGNORE INTO classes (name, slug, color, tier, active, sort_order) VALUES
  ('Guardian', 'guardian', '#f5c542', 4, 1, 1),
  ('Conqueror', 'conqueror', '#ff4f5e', 4, 1, 2),
  ('Destroyer', 'destroyer', '#a855f7', 4, 1, 3),
  ('Dominator', 'dominator', '#38bdf8', 4, 1, 4);

INSERT OR IGNORE INTO guild_ranks (name, slug, sort_order, requires_verification) VALUES
  ('Leader', 'leader', 1, 1),
  ('Deputy', 'deputy', 2, 1),
  ('Officer', 'officer', 3, 1),
  ('Member', 'member', 4, 0);
