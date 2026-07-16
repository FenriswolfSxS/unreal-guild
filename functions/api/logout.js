<<<<<<< HEAD
import { clearSessionCookie, getCookie, json } from './_utils.js';

export async function onRequestPost({ request, env }) {
  const token = getCookie(request, 'sxs_session');
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie() });
}
=======
import { json, logout } from './_lib.js';
export async function onRequestPost({ request, env }) { if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500); try { return await logout(request, env); } catch (err) { return json({ ok:false, error: err?.message || 'API error' },500); } }
>>>>>>> origin/main
