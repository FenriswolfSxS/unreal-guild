import { json, requireLeadership } from '../_lib.js';
import { getAssetsBucket } from '../_r2.js';
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
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing. Expected binding name: DB.' },500);
  const auth = await requireLeadership(request, env); if (auth.error) return auth.error;
  await ensureMediaTable(env);
  const body = await request.json().catch(()=>({}));
  const id = String(body?.id || '').trim();
  if (!id) return json({ ok:false, error:'Missing media id.' },400);
  const asset = await env.DB.prepare('SELECT id, filename FROM media_assets WHERE id=?').bind(id).first();
  if (!asset) return json({ ok:false, error:'Media item not found.' },404);
  const bucket = getAssetsBucket(env);
  if (bucket) await bucket.delete(asset.filename);
  await env.DB.prepare('DELETE FROM media_assets WHERE id=?').bind(id).run();
  return json({ ok:true });
}
