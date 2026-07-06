import { getCurrentUser, json } from './_utils.js';

export async function onRequestGet({ request, env }) {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: true, signedIn: false });
  return json({ ok: true, signedIn: true, user });
}
