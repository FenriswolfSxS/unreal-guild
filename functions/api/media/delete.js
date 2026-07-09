import { json, readJson, requireUser, getUserPermissions, cleanText } from '../_lib.js';

async function ensureMediaTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS media_assets (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    uploaded_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
}
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500);
  await ensureMediaTable(env);
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const perms = await getUserPermissions(env, auth.user.id);
  if (!perms.includes('admin_dashboard')) return json({ ok:false, error:'You do not have permission to delete media.' },403);
  const body = await readJson(request); const id = cleanText(body?.id);
  const asset = await env.DB.prepare('SELECT id, filename FROM media_assets WHERE id=?').bind(id).first();
  if (!asset) return json({ ok:false, error:'Media item not found.' },404);
  const bucket = env.ASSETS || env.R2_ASSETS || env.Assests || env.ASSESTS;
  if (bucket) await bucket.delete(`media/${asset.id}/${asset.filename}`);
  await env.DB.prepare('DELETE FROM media_assets WHERE id=?').bind(id).run();
  return json({ ok:true, message:'Media item deleted.' });
}
