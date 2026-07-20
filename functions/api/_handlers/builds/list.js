import { json, slugify, getCurrentUser } from '../../_lib.js';
const ALLOWED = new Set(['conqueror','guardian','destroyer','dominator']);
const PATH_MAP = { duelist:'conqueror', knight:'guardian', sorcerer:'destroyer', sage:'dominator', conqueror:'conqueror', guardian:'guardian', destroyer:'destroyer', dominator:'dominator' };
function normalizeBuildPath(value){
  let raw = String(value || '').trim().toLowerCase();
  raw = raw.split('?')[0].split('#')[0].replace(/^\/+/, '').replace(/\/+$/, '');
  raw = raw.replace(/\.html?$/, '').replace(/-builds$/, '');
  const key = slugify(raw || value || '');
  return PATH_MAP[key] || key;
}
async function ensureBuildTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS member_builds (
    id TEXT PRIMARY KEY, path TEXT NOT NULL, class_name TEXT NOT NULL DEFAULT '', title TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '', import_code TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '', build_json TEXT NOT NULL DEFAULT '', visibility TEXT NOT NULL DEFAULT 'public',
    created_by TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')), created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
  const cols = await env.DB.prepare('PRAGMA table_info(member_builds)').all();
  const names = new Set((cols.results || []).map(c => c.name));
  if (!names.has('build_json')) await env.DB.prepare("ALTER TABLE member_builds ADD COLUMN build_json TEXT NOT NULL DEFAULT ''").run();
  if (!names.has('visibility')) await env.DB.prepare("ALTER TABLE member_builds ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public'").run();
  if (!names.has('sort_order')) await env.DB.prepare("ALTER TABLE member_builds ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0").run();
}
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing. Expected binding name: DB.' },500);
  const url = new URL(request.url);
  const mine = url.searchParams.get('mine') === '1';
  const path = normalizeBuildPath(url.searchParams.get('path') || '');
  if (!mine && !ALLOWED.has(path)) return json({ ok:false, error:'Unknown build page.' },400);
  await ensureBuildTable(env);
  const auth = await getCurrentUser(request, env);
  let rows;
  if (mine) {
    if (!auth) return json({ ok:true, builds: [] }, 200, { 'cache-control':'no-store' });
    rows = await env.DB.prepare(`
      SELECT b.*, u.ingame_name, u.username
      FROM member_builds b LEFT JOIN users u ON u.id = b.created_by
      WHERE b.created_by = ?
      ORDER BY b.updated_at DESC, b.created_at DESC
    `).bind(auth.id).all();
  } else {
    rows = await env.DB.prepare(`
      SELECT b.*, u.ingame_name, u.username
      FROM member_builds b LEFT JOIN users u ON u.id = b.created_by
      WHERE b.path = ? AND COALESCE(b.visibility,'public') = 'public'
      ORDER BY CASE WHEN b.sort_order > 0 THEN 0 ELSE 1 END, b.sort_order ASC, b.created_at ASC
    `).bind(path).all();
  }
  return json({ ok:true, builds: rows.results || [] }, 200, { 'cache-control':'no-store, no-cache, must-revalidate' });
}
