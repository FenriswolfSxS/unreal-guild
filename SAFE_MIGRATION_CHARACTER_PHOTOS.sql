-- SAFE ADDITIVE MIGRATION: Member character photos
-- Cloudflare D1 -> unreal-guild -> Console -> Paste -> Run
-- This does not delete or overwrite any existing member data.

CREATE TABLE IF NOT EXISTS member_profiles (
  user_id TEXT PRIMARY KEY,
  character_image_url TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
