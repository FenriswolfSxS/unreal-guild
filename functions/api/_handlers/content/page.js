import { json, readJson, requireUser, getUserPermissions, cleanText, slugify } from '../../_lib.js';
function has(perms, slug) { return perms.includes(slug) || perms.includes('admin_dashboard') || perms.includes('manage_site_settings'); }
const ALLOWED = new Set(['guides','food-guide','farming-guide','fantamon-guide','stat-guide','class-builds','class-builds-notes','conqueror-builds','guardian-builds','destroyer-builds','dominator-builds','farming','fantamon','stats']);
function normalizePageKey(key) {
  if (key === 'farming') return 'farming-guide';
  if (key === 'fantamon') return 'fantamon-guide';
  if (key === 'stats') return 'stat-guide';
  return key;
}
async function ensureRevisionTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS site_page_revisions (
    id TEXT PRIMARY KEY,
    page_key TEXT NOT NULL,
    title TEXT NOT NULL,
    content_html TEXT NOT NULL DEFAULT '',
    edited_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500);
  const url = new URL(request.url);
  let pageKey = slugify(url.searchParams.get('page_key') || 'guides');
  pageKey = normalizePageKey(pageKey);
  if (!ALLOWED.has(pageKey)) return json({ ok:false, error:'Unknown guide page.' },404);
  let page = await env.DB.prepare('SELECT page_key, title, content_html, updated_at FROM site_pages WHERE page_key=?').bind(pageKey).first();
  if (!page) {
    page = { page_key: pageKey, title: pageKey, content_html: '' };
  }
  return json({ ok:true, page });
}

export async function onRequestPut({ request, env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500);
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const perms = await getUserPermissions(env, auth.user.id);
  if (!has(perms, 'edit_guides')) return json({ ok:false, error:'You do not have permission to edit guide pages.' },403);
  const body = await readJson(request);
  let pageKey = slugify(body?.page_key || 'guides');
  pageKey = normalizePageKey(pageKey);
  if (!ALLOWED.has(pageKey)) return json({ ok:false, error:'Unknown guide page.' },400);
  const title = cleanText(body?.title).slice(0,100) || pageKey;
  const content = String(body?.content_html || '').slice(0,200000);
  await ensureRevisionTable(env);
  const previous = await env.DB.prepare('SELECT page_key, title, content_html FROM site_pages WHERE page_key=?').bind(pageKey).first();
  if (previous && previous.content_html !== content) {
    await env.DB.prepare('INSERT INTO site_page_revisions (id, page_key, title, content_html, edited_by) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), previous.page_key, previous.title, previous.content_html, auth.user.id).run();
  }
  await env.DB.prepare(`INSERT INTO site_pages (page_key, title, content_html, updated_by, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(page_key) DO UPDATE SET title=excluded.title, content_html=excluded.content_html, updated_by=excluded.updated_by, updated_at=datetime('now')`)
    .bind(pageKey, title, content, auth.user.id).run();
  return json({ ok:true, message:'Guide content saved.' });
}
