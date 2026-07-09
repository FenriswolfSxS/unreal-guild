import { json, requireUser, getUserPermissions } from '../_lib.js';
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500);
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const perms = await getUserPermissions(env, auth.user.id);
  if (!perms.includes('admin_dashboard')) return json({ ok:false, error:'You do not have permission to view the media library.' },403);
  const rows = await env.DB.prepare(`SELECT m.id, m.filename, m.url, m.created_at, COALESCE(u.ingame_name, u.username, 'Leadership') AS uploaded_by_name
    FROM media_assets m LEFT JOIN users u ON u.id=m.uploaded_by ORDER BY m.created_at DESC`).all();
  return json({ ok:true, assets: rows.results || [] });
}
