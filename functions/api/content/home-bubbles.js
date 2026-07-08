import { audit, json, readJson, requirePermission } from '../_utils.js';

export async function onRequestGet({ env }) {
  const rows = await env.DB.prepare(`
    SELECT id, title, body, button_label, button_link, updated_at
    FROM home_bubbles
    ORDER BY id
  `).all();
  return json({ ok: true, bubbles: rows.results || [] });
}

export async function onRequestPut({ request, env }) {
  const auth = await requirePermission(request, env, 'edit_home');
  if (auth.error) return auth.error;

  const data = await readJson(request);
  const bubbles = Array.isArray(data?.bubbles) ? data.bubbles : [];
  if (bubbles.length !== 4) return json({ ok: false, error: 'Exactly 4 homepage bubbles are required.' }, 400);

  const stmt = env.DB.prepare(`
    UPDATE home_bubbles
    SET title = ?, body = ?, button_label = ?, button_link = ?, updated_by = ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  for (const b of bubbles) {
    const id = Number(b.id);
    if (![1,2,3,4].includes(id)) return json({ ok: false, error: 'Invalid bubble ID.' }, 400);
    await stmt.bind(
      String(b.title || '').trim().slice(0, 80),
      String(b.body || '').trim().slice(0, 600),
      String(b.button_label || '').trim().slice(0, 40),
      String(b.button_link || '').trim().slice(0, 300),
      auth.user.id,
      id
    ).run();
  }

  await audit(env, auth.user.id, 'edit_home_bubbles', 'home_bubbles', 'all', 'Updated homepage bubbles');
  return json({ ok: true });
}
