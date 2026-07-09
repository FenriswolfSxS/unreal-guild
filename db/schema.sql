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
  requires_verification INTEGER NOT NULL DEFAULT 0,
  permission_group TEXT NOT NULL DEFAULT 'member'
);

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS rank_permissions (
  rank_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  PRIMARY KEY (rank_id, permission_id),
  FOREIGN KEY (rank_id) REFERENCES guild_ranks(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
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

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body_html TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS site_pages (
  page_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content_html TEXT NOT NULL DEFAULT '',
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS home_bubbles (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  button_label TEXT NOT NULL DEFAULT '',
  button_link TEXT NOT NULL DEFAULT '',
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT '',
  target_id TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_guild_members_rank ON guild_members(rank_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_class ON guild_members(class_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_user_id);

INSERT OR IGNORE INTO classes (name, slug, color, tier, active, sort_order) VALUES
  ('Guardian', 'guardian', '#f5c542', 4, 1, 1),
  ('Conqueror', 'conqueror', '#ff4f5e', 4, 1, 2),
  ('Destroyer', 'destroyer', '#a855f7', 4, 1, 3),
  ('Dominator', 'dominator', '#38bdf8', 4, 1, 4);

INSERT OR IGNORE INTO guild_ranks (name, slug, sort_order, requires_verification, permission_group) VALUES
  ('Leader', 'leader', 1, 1, 'leadership'),
  ('Deputy', 'deputy', 2, 1, 'leadership'),
  ('Officer', 'officer', 3, 1, 'leadership'),
  ('Member', 'member', 4, 0, 'member');

UPDATE guild_ranks SET permission_group = 'leadership', requires_verification = 1 WHERE slug IN ('leader','deputy','officer');
UPDATE guild_ranks SET permission_group = 'member', requires_verification = 0 WHERE slug = 'member';

INSERT OR IGNORE INTO permissions (slug, name, description) VALUES
  ('view_roster', 'View Guild Roster', 'Can view the guild roster.'),
  ('edit_own_profile', 'Edit Own Profile', 'Can edit their own in-game name and class.'),
  ('create_posts', 'Create Posts', 'Can create posts.'),
  ('edit_own_posts', 'Edit Own Posts', 'Can edit their own posts.'),
  ('delete_own_posts', 'Delete Own Posts', 'Can delete their own posts.'),
  ('create_builds', 'Create Builds', 'Can create community builds.'),
  ('edit_own_builds', 'Edit Own Builds', 'Can edit their own community builds.'),
  ('delete_own_builds', 'Delete Own Builds', 'Can delete their own community builds.'),
  ('admin_dashboard', 'Admin Dashboard', 'Can access the admin dashboard.'),
  ('manage_members', 'Manage Members', 'Can manage member accounts and roster data.'),
  ('change_ranks', 'Change Ranks', 'Can change guild ranks.'),
  ('moderate_posts', 'Moderate Posts', 'Can edit or remove posts from anyone.'),
  ('moderate_builds', 'Moderate Builds', 'Can edit or remove builds from anyone.'),
  ('edit_guides', 'Edit Guides', 'Can edit guide pages and guide screenshots.'),
  ('edit_home', 'Edit Homepage', 'Can edit homepage content bubbles.'),
  ('manage_site_settings', 'Manage Site Settings', 'Can change site settings.'),
  ('view_audit_log', 'View Audit Log', 'Can view administrative activity history.');

INSERT OR IGNORE INTO rank_permissions (rank_id, permission_id)
SELECT r.id, p.id
FROM guild_ranks r, permissions p
WHERE r.slug = 'member'
AND p.slug IN (
  'view_roster',
  'edit_own_profile',
  'create_posts',
  'edit_own_posts',
  'delete_own_posts',
  'create_builds',
  'edit_own_builds',
  'delete_own_builds'
);

INSERT OR IGNORE INTO rank_permissions (rank_id, permission_id)
SELECT r.id, p.id
FROM guild_ranks r, permissions p
WHERE r.slug IN ('leader','deputy','officer');

INSERT OR IGNORE INTO home_bubbles (id, title, body, button_label, button_link) VALUES
  (1, 'Welcome', 'Coming soon.', '', ''),
  (2, 'Rules of Conduct', 'Coming soon.', '', ''),
  (3, 'Expectations', 'Coming soon.', '', ''),
  (4, 'Requirements', 'Coming soon.', '', '');

INSERT OR IGNORE INTO site_pages (page_key, title, content_html) VALUES
  ('guides', 'Guides', '<p>Guild knowledge, guides, and strategy pages.</p>'),
  ('food-guide', 'Food Guide', '<p>Phee''s full Sword X Staff food system guide with recipes and screenshots.</p>'),
  ('farming', 'Farming Guides', '<p>Routes, resources, farming tips, and material locations.</p>'),
  ('fantamon', 'Fantamon Guides', '<p>Fantamon info, recommendations, and upgrade tips.</p>'),
  ('stats', 'Stat Guide', '<p>Stat priorities, explanations, and class-specific stat notes.</p>');
