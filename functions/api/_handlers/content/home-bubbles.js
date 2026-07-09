import { json, readJson, requireUser, getUserPermissions, cleanText } from '../../_lib.js';

function has(perms, slug) { return perms.includes(slug) || perms.includes('admin_dashboard') || perms.includes('manage_site_settings'); }
async function ensureHomeBubbleColumns(env) {
  const cols = await env.DB.prepare('PRAGMA table_info(home_bubbles)').all();
  const names = new Set((cols.results || []).map(c => c.name));
  const alters = [];
  if (!names.has('pos_x')) alters.push('ALTER TABLE home_bubbles ADD COLUMN pos_x INTEGER NOT NULL DEFAULT 0');
  if (!names.has('pos_y')) alters.push('ALTER TABLE home_bubbles ADD COLUMN pos_y INTEGER NOT NULL DEFAULT 0');
  if (!names.has('width')) alters.push('ALTER TABLE home_bubbles ADD COLUMN width INTEGER NOT NULL DEFAULT 260');
  if (!names.has('height')) alters.push('ALTER TABLE home_bubbles ADD COLUMN height INTEGER NOT NULL DEFAULT 190');
  if (!names.has('quick_label')) alters.push("ALTER TABLE home_bubbles ADD COLUMN quick_label TEXT NOT NULL DEFAULT ''");
  if (!names.has('title_style')) alters.push("ALTER TABLE home_bubbles ADD COLUMN title_style TEXT NOT NULL DEFAULT ''");
  if (!names.has('body_style')) alters.push("ALTER TABLE home_bubbles ADD COLUMN body_style TEXT NOT NULL DEFAULT ''");
  for (const sql of alters) await env.DB.prepare(sql).run();
}

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500);
  await ensureHomeBubbleColumns(env);
  const rows = await env.DB.prepare('SELECT id, title, body, button_label, button_link, quick_label, pos_x, pos_y, width, height, title_style, body_style, updated_at FROM home_bubbles ORDER BY id ASC').all();
  return json({ ok:true, bubbles: rows.results || [] });
}

export async function onRequestPut({ request, env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500);
  await ensureHomeBubbleColumns(env);
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const perms = await getUserPermissions(env, auth.user.id);
  if (!has(perms, 'edit_home')) return json({ ok:false, error:'You do not have permission to edit homepage bubbles.' },403);
  const body = await readJson(request);
  const bubbles = Array.isArray(body?.bubbles) ? body.bubbles : [];
  if (!bubbles.length) return json({ ok:false, error:'No bubbles were sent.' },400);
  const statements = [];
  function safeStyle(input) {
    const raw = String(input || '');
    const out = [];
    const allowedColors = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
    const allowedSize = /^(0\.8|0\.9|1|1\.1|1\.25|1\.5|1\.75|2|2\.5|3)rem$/;
    const allowedWeight = /^(400|600|700|800|900)$/;
    for (const part of raw.split(';')) {
      const [k, v] = part.split(':').map(x => String(x || '').trim());
      if (k === 'color' && allowedColors.test(v)) out.push(`color:${v}`);
      if (k === 'font-size' && allowedSize.test(v)) out.push(`font-size:${v}`);
      if (k === 'font-weight' && allowedWeight.test(v)) out.push(`font-weight:${v}`);
      if (k === 'font-style' && (v === 'italic' || v === 'normal')) out.push(`font-style:${v}`);
      if (k === 'text-align' && ['left','center','right'].includes(v)) out.push(`text-align:${v}`);
    }
    return out.join(';');
  }
  for (const b of bubbles) {
    const id = Number(b.id);
    if (!Number.isInteger(id) || id < 1 || id > 4) continue;
    statements.push(env.DB.prepare(`UPDATE home_bubbles SET title=?, body=?, button_label=?, button_link=?, quick_label=?, pos_x=?, pos_y=?, width=?, height=?, title_style=?, body_style=?, updated_by=?, updated_at=datetime('now') WHERE id=?`).bind(
      cleanText(b.title).slice(0,80) || 'Untitled',
      cleanText(b.body).slice(0,800),
      cleanText(b.button_label).slice(0,40),
      cleanText(b.button_link).slice(0,300),
      cleanText(b.quick_label || b.title).slice(0,40),
      Math.max(0, Math.min(1400, Number(b.pos_x) || 0)),
      Math.max(0, Math.min(900, Number(b.pos_y) || 0)),
      Math.max(180, Math.min(520, Number(b.width) || 260)),
      Math.max(140, Math.min(440, Number(b.height) || 190)),
      safeStyle(b.title_style),
      safeStyle(b.body_style),
      auth.user.id,
      id
    ));
  }
  if (!statements.length) return json({ ok:false, error:'No valid bubbles were sent.' },400);
  await env.DB.batch(statements);
  return json({ ok:true, message:'Homepage bubbles saved.' });
}
