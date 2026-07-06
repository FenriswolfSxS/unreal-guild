import { clearSessionCookie, getCookie, json } from './_utils.js';

export async function onRequestPost({ request, env }) {
  const token = getCookie(request, 'sxs_session');
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie() });
}
