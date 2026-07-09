import { json, readJson, requireUser, getUserPermissions, cleanText } from '../_lib.js';

function has(perms, slug) { return perms.includes(slug) || perms.includes('admin_dashboard') || perms.includes('manage_site_settings'); }

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500);
  const rows = await env.DB.prepare('SELECT id, title, body, button_label, button_link, updated_at FROM home_bubbles ORDER BY id ASC').all();
  return json({ ok:true, bubbles: rows.results || [] });
}

export async function onRequestPut({ request, env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500);
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const perms = await getUserPermissions(env, auth.user.id);
  if (!has(perms, 'edit_home')) return json({ ok:false, error:'You do not have permission to edit homepage bubbles.' },403);
  const body = await readJson(request);
  const bubbles = Array.isArray(body?.bubbles) ? body.bubbles : [];
  if (!bubbles.length) return json({ ok:false, error:'No bubbles were sent.' },400);
  const statements = [];
  for (const b of bubbles) {
    const id = Number(b.id);
    if (!Number.isInteger(id) || id < 1 || id > 4) continue;
    statements.push(env.DB.prepare(`UPDATE home_bubbles SET title=?, body=?, button_label=?, button_link=?, updated_by=?, updated_at=datetime('now') WHERE id=?`).bind(
      cleanText(b.title).slice(0,80) || 'Untitled',
      cleanText(b.body).slice(0,500),
      cleanText(b.button_label).slice(0,40),
      cleanText(b.button_link).slice(0,300),
      auth.user.id,
      id
    ));
  }
  if (!statements.length) return json({ ok:false, error:'No valid bubbles were sent.' },400);
  await env.DB.batch(statements);
  return json({ ok:true, message:'Homepage bubbles saved.' });
}
