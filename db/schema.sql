-- SxS The Unreal / Unreal Guild V2 database schema for Cloudflare D1
-- Run this in Cloudflare D1 Console for the unreal-guild database.
-- NOTE: This resets the member/account tables. Safe now before real members register.

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS rank_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS rank_requests;
DROP TABLE IF EXISTS guild_members;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS guild_ranks;
DROP TABLE IF EXISTS classes;

PRAGMA foreign_keys = ON;

CREATE TABLE classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  tier INTEGER NOT NULL DEFAULT 4,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE guild_ranks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL UNIQUE,
  requires_verification INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE permissions (
  permission_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE rank_permissions (
  rank_id INTEGER NOT NULL,
  permission_key TEXT NOT NULL,
  PRIMARY KEY (rank_id, permission_key),
  FOREIGN KEY (rank_id) REFERENCES guild_ranks(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_key) REFERENCES permissions(permission_key) ON DELETE CASCADE
);

CREATE TABLE users (
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

CREATE TABLE guild_members (
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

CREATE TABLE rank_requests (
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

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  target_user_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_guild_members_rank ON guild_members(rank_id);
CREATE INDEX idx_guild_members_class ON guild_members(class_id);
CREATE INDEX idx_users_ingame ON users(ingame_name);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

INSERT INTO classes (name, slug, color, tier, active, sort_order) VALUES
  ('Guardian', 'guardian', '#f5c542', 4, 1, 1),
  ('Conqueror', 'conqueror', '#ff4f5e', 4, 1, 2),
  ('Destroyer', 'destroyer', '#a855f7', 4, 1, 3),
  ('Dominator', 'dominator', '#38bdf8', 4, 1, 4);

INSERT INTO guild_ranks (name, slug, sort_order, requires_verification) VALUES
  ('Leader', 'leader', 1, 1),
  ('Deputy', 'deputy', 2, 1),
  ('Officer', 'officer', 3, 1),
  ('Member', 'member', 4, 0);

INSERT INTO permissions (permission_key, label, description) VALUES
  ('view_roster', 'View Guild Roster', 'Can view the live guild roster.'),
  ('edit_own_profile', 'Edit Own Profile', 'Can edit their own in-game name and class.'),
  ('create_builds', 'Create Builds', 'Can create builds when community builds are enabled.'),
  ('edit_own_builds', 'Edit Own Builds', 'Can edit builds they created.'),
  ('manage_builds', 'Manage Builds', 'Can edit, hide, approve, or feature community builds.'),
  ('feature_builds', 'Feature Builds', 'Can mark selected builds as featured.'),
  ('moderate_comments', 'Moderate Comments', 'Can hide or remove inappropriate comments.'),
  ('manage_members', 'Manage Members', 'Can update member roster details and disable member accounts.'),
  ('verify_ranks', 'Verify Rank Requests', 'Can approve Deputy, Officer, or Member rank changes.'),
  ('manage_ranks', 'Manage Ranks', 'Can change rank structure or promote to high-level roles.'),
  ('manage_guides', 'Manage Guides', 'Can edit guide content when guide editing is built.'),
  ('manage_site_settings', 'Manage Site Settings', 'Can change site-level settings.'),
  ('view_admin', 'View Admin Panel', 'Can access admin tools.'),
  ('view_audit_log', 'View Audit Log', 'Can review admin action history.');

-- Leader: full control
INSERT INTO rank_permissions (rank_id, permission_key)
SELECT r.id, p.permission_key FROM guild_ranks r CROSS JOIN permissions p WHERE r.slug = 'leader';

-- Deputy: strong management, but not site/rank structure owner controls
INSERT INTO rank_permissions (rank_id, permission_key)
SELECT r.id, p.permission_key FROM guild_ranks r JOIN permissions p ON p.permission_key IN (
  'view_roster','edit_own_profile','create_builds','edit_own_builds','manage_builds','feature_builds',
  'moderate_comments','manage_members','verify_ranks','view_admin','view_audit_log'
) WHERE r.slug = 'deputy';

-- Officer: moderation and build/member help, but no rank/site settings
INSERT INTO rank_permissions (rank_id, permission_key)
SELECT r.id, p.permission_key FROM guild_ranks r JOIN permissions p ON p.permission_key IN (
  'view_roster','edit_own_profile','create_builds','edit_own_builds','manage_builds','moderate_comments','view_admin'
) WHERE r.slug = 'officer';

-- Member: normal guild features
INSERT INTO rank_permissions (rank_id, permission_key)
SELECT r.id, p.permission_key FROM guild_ranks r JOIN permissions p ON p.permission_key IN (
  'view_roster','edit_own_profile','create_builds','edit_own_builds'
) WHERE r.slug = 'member';
