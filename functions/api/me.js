<<<<<<< HEAD
import { getCurrentUser, json } from './_utils.js';

export async function onRequestGet({ request, env }) {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: true, signedIn: false });
  return json({ ok: true, signedIn: true, user });
}
=======
import { json, me } from './_lib.js';
export async function onRequestGet({ request, env }) { if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500); try { return await me(request, env); } catch (err) { return json({ ok:false, error: err?.message || 'API error' },500); } }
>>>>>>> origin/main
