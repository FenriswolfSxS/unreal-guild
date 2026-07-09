import { json, slugify } from '../_lib.js';
const ALLOWED = new Set(['conqueror','guardian','destroyer','dominator']);
async function ensureBuildTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS member_builds (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    class_name TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '',
    import_code TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
}
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500);
  const url = new URL(request.url);
  const path = slugify(url.searchParams.get('path') || '');
  if (!ALLOWED.has(path)) return json({ ok:false, error:'Unknown build page.' },400);
  await ensureBuildTable(env);
  const rows = await env.DB.prepare(`
    SELECT b.*, u.ingame_name, u.username
    FROM member_builds b
    LEFT JOIN users u ON u.id = b.created_by
    WHERE b.path = ?
    ORDER BY b.updated_at DESC, b.created_at DESC
  `).bind(path).all();
  return json({ ok:true, builds: rows.results || [] });
}
