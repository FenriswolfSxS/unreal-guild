import { getAssetsBucket } from '../_r2.js';
import { json, cleanText } from '../_lib.js';

async function ensureMediaTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS media_assets (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    uploaded_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
}
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500);
  await ensureMediaTable(env);
  const bucket = getAssetsBucket(env);
  if (!bucket) return json({ ok:false, error:'R2 bucket binding is missing.' },500);
  const url = new URL(request.url);
  const id = cleanText(url.searchParams.get('id'));
  const asset = await env.DB.prepare('SELECT id, filename FROM media_assets WHERE id=?').bind(id).first();
  if (!asset) return json({ ok:false, error:'Media item not found.' },404);
  const storedName = String(asset.filename || '');
  const key = storedName.startsWith('media/') ? storedName : `media/${asset.id}/${storedName}`;
  const object = await bucket.get(key);
  if (!object) return json({ ok:false, error:'File is missing from R2.' },404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}
