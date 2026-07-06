import { cleanText, json, requireUser, readJson, slugify } from './_utils.js';

export async function onRequestPost({ request, env }) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  const ingameName = cleanText(body?.ingameName);
  const classSlug = slugify(body?.classSlug);

  if (ingameName.length < 2) return json({ ok: false, error: 'In-game name is required.' }, 400);

  const duplicate = await env.DB.prepare(`
    SELECT id FROM users WHERE lower(ingame_name) = lower(?) AND id != ? LIMIT 1
  `).bind(ingameName, auth.user.id).first();
  if (duplicate) return json({ ok: false, error: 'That in-game name is already registered.' }, 409);

  const statements = [
    env.DB.prepare(`UPDATE users SET ingame_name = ?, updated_at = datetime('now') WHERE id = ?`).bind(ingameName, auth.user.id)
  ];

  if (auth.user.account_type === 'guild_member') {
    const classRow = await env.DB.prepare('SELECT id FROM classes WHERE slug = ? AND active = 1').bind(classSlug).first();
    if (!classRow) return json({ ok: false, error: 'Choose a valid class.' }, 400);
    statements.push(
      env.DB.prepare(`UPDATE guild_members SET class_id = ?, updated_at = datetime('now') WHERE user_id = ?`).bind(classRow.id, auth.user.id)
    );
  }

  await env.DB.batch(statements);
  return json({ ok: true, message: 'Profile updated.' });
}
