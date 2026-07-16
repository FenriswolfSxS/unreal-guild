import { json, readJson, requireUser, getUserPermissions, cleanText, slugify } from '../../_lib.js';
function has(perms, slug) { return perms.includes(slug) || perms.includes('admin_dashboard') || perms.includes('manage_site_settings'); }
const ALLOWED = new Set(['home','events','guides','food-guide','farming-guide','fantamon-guide','stat-guide','class-builds','class-builds-notes','conqueror-builds','guardian-builds','destroyer-builds','dominator-builds','farming','fantamon','stats']);
function normalizePageKey(key) {
  if (key === 'farming') return 'farming-guide';
  if (key === 'fantamon') return 'fantamon-guide';
  if (key === 'stats') return 'stat-guide';
  return key;
}
async function ensurePageJsonColumn(env) {
  const info = await env.DB.prepare("PRAGMA table_info(site_pages)").all();
  const hasJson = (info.results || []).some(c => c.name === 'content_json');
  if (!hasJson) await env.DB.prepare("ALTER TABLE site_pages ADD COLUMN content_json TEXT NOT NULL DEFAULT ''").run();
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
  await ensurePageJsonColumn(env);
  let page = await env.DB.prepare('SELECT page_key, title, content_html, content_json, updated_at FROM site_pages WHERE page_key=?').bind(pageKey).first();
  if (!page) {
    page = { page_key: pageKey, title: pageKey, content_html: '' };
  }
  return json({ ok:true, page });
}

export async function onRequestPut({ request, env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500);
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const perms = await getUserPermissions(env, auth.user.id);
  const body = await readJson(request);
  let pageKey = slugify(body?.page_key || 'guides');
  pageKey = normalizePageKey(pageKey);
  const permitted = pageKey === 'home'
    ? (has(perms, 'edit_home') || has(perms, 'edit_guides'))
    : pageKey === 'events'
      ? (has(perms, 'edit_events') || has(perms, 'edit_guides'))
      : has(perms, 'edit_guides');
  if (!permitted) return json({ ok:false, error:'You do not have permission to edit this page.' },403);
  if (!ALLOWED.has(pageKey)) return json({ ok:false, error:'Unknown guide page.' },400);
  const title = cleanText(body?.title).slice(0,100) || pageKey;
  const content = String(body?.content_html || '').slice(0,200000);
  let contentJson = '';
  if (Array.isArray(body?.content_json)) {
    contentJson = JSON.stringify(body.content_json).slice(0,200000);
  } else if (typeof body?.content_json === 'string') {
    try { const parsed = JSON.parse(body.content_json); if (Array.isArray(parsed)) contentJson = JSON.stringify(parsed).slice(0,200000); } catch (_) {}
  }
  await ensurePageJsonColumn(env);
  await ensureRevisionTable(env);
  const previous = await env.DB.prepare('SELECT page_key, title, content_html FROM site_pages WHERE page_key=?').bind(pageKey).first();
  if (previous && previous.content_html !== content) {
    await env.DB.prepare('INSERT INTO site_page_revisions (id, page_key, title, content_html, edited_by) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), previous.page_key, previous.title, previous.content_html, auth.user.id).run();
  }
  const write = await env.DB.prepare(`INSERT INTO site_pages (page_key, title, content_html, content_json, updated_by, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(page_key) DO UPDATE SET title=excluded.title, content_html=excluded.content_html, content_json=excluded.content_json, updated_by=excluded.updated_by, updated_at=datetime('now')`)
    .bind(pageKey, title, content, contentJson, auth.user.id).run();
  if (!write?.success) return json({ ok:false, error:'D1 did not confirm the page save.' },500);

  // Read the record back before reporting success. This prevents a stale or
  // mismatched route from claiming that modular content was saved when it was not.
  const saved = await env.DB.prepare('SELECT page_key, title, content_json, updated_at FROM site_pages WHERE page_key=?').bind(pageKey).first();
  if (!saved || String(saved.content_json || '') !== contentJson) {
    return json({ ok:false, error:'The page was not stored correctly. Please try again.' },500);
  }
  return json({ ok:true, message:'Page content saved.', page:saved });
}
