<<<<<<< HEAD
import { cleanText, createSession, json, readJson, sessionCookie, verifyPassword } from './_utils.js';

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const login = cleanText(body?.login).toLowerCase();
  const password = String(body?.password || '');
  if (!login || !password) return json({ ok: false, error: 'Email/username and password are required.' }, 400);

  const user = await env.DB.prepare(`
    SELECT * FROM users
    WHERE lower(email) = ? OR lower(username) = ? OR lower(ingame_name) = ?
    LIMIT 1
  `).bind(login, login, login).first();

  if (!user || user.status !== 'active') return json({ ok: false, error: 'Invalid login.' }, 401);
  const ok = await verifyPassword(password, user.password_salt, user.password_hash);
  if (!ok) return json({ ok: false, error: 'Invalid login.' }, 401);

  await env.DB.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').bind(user.id).run();
  const token = await createSession(env, user.id);
  return json({ ok: true, message: 'Signed in.' }, 200, { 'set-cookie': sessionCookie(token) });
}
=======
import { json, login } from './_lib.js';
export async function onRequestPost({ request, env }) { if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500); try { return await login(request, env); } catch (err) { return json({ ok:false, error: err?.message || 'API error' },500); } }
>>>>>>> origin/main
