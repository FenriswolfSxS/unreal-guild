import { json, requirePermission } from '../_utils.js';

export async function onRequestGet({ request, env }) {
  const auth = await requirePermission(request, env, 'admin_dashboard');
  if (auth.error) return auth.error;
  const rows = await env.DB.prepare(`
    SELECT m.id, m.filename, m.url, m.created_at, u.ingame_name AS uploaded_by_name
    FROM media_assets m
    LEFT JOIN users u ON u.id = m.uploaded_by
    ORDER BY m.created_at DESC
    LIMIT 100
  `).all();
  return json({ ok: true, assets: rows.results || [] });
}
