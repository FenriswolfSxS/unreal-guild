import { getCurrentUser, getUserPermissions, json } from './_utils.js';

export async function onRequestGet({ request, env }) {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: true, signedIn: false, permissions: [] });
  const permissions = await getUserPermissions(env, user.id);
  return json({ ok: true, signedIn: true, user, permissions });
}
