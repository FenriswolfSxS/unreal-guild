import { json, readJson, requireUser, getUserPermissions, cleanText, slugify } from '../../_lib.js';

function has(perms, slug) {
  return perms.includes(slug) || perms.includes('admin_dashboard') || perms.includes('manage_site_settings');
}

async function ensureTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS custom_guides (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT '📘',
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 100,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
}

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500);
  await ensureTable(env);
  const result = await env.DB.prepare(`SELECT id, slug, title, description, icon, sort_order, created_at
    FROM custom_guides WHERE active=1 ORDER BY sort_order ASC, created_at ASC`).all();
  return json({ ok:true, guides:result.results || [] });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500);
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const perms = await getUserPermissions(env, auth.user.id);
  if (!has(perms,'edit_guides')) return json({ ok:false, error:'You do not have permission to create guides.' },403);
  const body = await readJson(request);
  const title = cleanText(body?.title).slice(0,100);
  const description = cleanText(body?.description).slice(0,500);
  const icon = cleanText(body?.icon || '📘').slice(0,12) || '📘';
  const slug = slugify(body?.slug || title).slice(0,70);
  if (!title || !slug) return json({ ok:false, error:'Guide title is required.' },400);
  if (['food-guide','farming-guide','fantamon-guide','stat-guide','guides','home','events'].includes(slug)) {
    return json({ ok:false, error:'That guide name is already reserved.' },409);
  }
  await ensureTable(env);
  const id = crypto.randomUUID();
  try {
    await env.DB.prepare(`INSERT INTO custom_guides (id,slug,title,description,icon,created_by)
      VALUES (?,?,?,?,?,?)`).bind(id,slug,title,description,icon,auth.user.id).run();
    const pageKey = `guide-${slug}`;
    const initialRows = JSON.stringify([
      {id:crypto.randomUUID(),type:'row',columns:[[
        {id:crypto.randomUUID(),type:'heading',level:2,text:title},
        {id:crypto.randomUUID(),type:'text',html:`<p>${description || 'Start writing your new guide here.'}</p>`}
      ]]}
    ]);
    await env.DB.prepare(`INSERT INTO site_pages (page_key,title,content_html,content_json,updated_by,updated_at)
      VALUES (?,?,?,?,?,datetime('now'))
      ON CONFLICT(page_key) DO NOTHING`).bind(pageKey,title,'',initialRows,auth.user.id).run();
  } catch (err) {
    if (String(err?.message || '').toLowerCase().includes('unique')) return json({ok:false,error:'A guide with that name already exists.'},409);
    throw err;
  }
  return json({ok:true,guide:{id,slug,title,description,icon,url:`guide.html?slug=${encodeURIComponent(slug)}`}},201);
}
