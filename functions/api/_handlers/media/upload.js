import { getAssetsBucket } from '../../_r2.js';
import { json, requireUser, getUserPermissions, randomId, cleanText } from '../../_lib.js';
const ALLOWED = new Set(['image/png','image/jpeg','image/webp','image/gif']);
function safeFilename(name) { return cleanText(name).replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').slice(0,120) || 'image.png'; }

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
  await ensureMediaTable(env);
  const bucket = getAssetsBucket(env);
  if (!bucket) return json({ ok:false, error:'R2 bucket binding is missing. Expected binding name: R2_ASSETS. Do not use ASSETS on Cloudflare Pages because ASSETS is reserved.' },500);
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  // Any signed-in member may upload images for their saved builds. Leadership still uses the same endpoint for guide/home images.
  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return json({ ok:false, error:'Choose an image file first.' },400);
  if (!ALLOWED.has(file.type)) return json({ ok:false, error:'Only PNG, JPG, WEBP, and GIF images are allowed.' },400);
  if (file.size > 10 * 1024 * 1024) return json({ ok:false, error:'Image is too large. Max size is 10 MB.' },400);
  const id = randomId('media_');
  const filename = safeFilename(file.name);
  const key = `media/${id}/${filename}`;
  await bucket.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  const url = `/api/media/file?id=${encodeURIComponent(id)}`;
  await env.DB.prepare('INSERT INTO media_assets (id, filename, url, uploaded_by) VALUES (?, ?, ?, ?)').bind(id, key, url, auth.user.id).run();
  return json({ ok:true, asset:{ id, filename, key, url } },201);
}
