import { getAssetsBucket } from '../_r2.js';
import { json, requireUser, randomId, cleanText } from '../_lib.js';

const TYPE_BY_EXTENSION = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif'
};
const ALLOWED_TYPES = new Set(Object.values(TYPE_BY_EXTENSION));

function safeFilename(name) {
  return cleanText(name).replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').slice(0, 120) || 'image.png';
}
function extensionOf(name) {
  const match = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
}
function resolvedContentType(file) {
  const reported = String(file?.type || '').toLowerCase();
  if (ALLOWED_TYPES.has(reported)) return reported;
  return TYPE_BY_EXTENSION[extensionOf(file?.name)] || '';
}
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
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing. Expected binding name: DB.' }, 500);
  const bucket = getAssetsBucket(env);
  if (!bucket) return json({ ok:false, error:'Image storage is not connected. Add an R2 bucket binding named R2_ASSETS to this Cloudflare Pages project, then redeploy.' }, 500);

  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;

  let form;
  try {
    form = await request.formData();
  } catch (_) {
    return json({ ok:false, error:'The image upload could not be read. Choose the file again and retry.' }, 400);
  }

  const file = form.get('file');
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
    return json({ ok:false, error:'Choose an image file first.' }, 400);
  }

  const contentType = resolvedContentType(file);
  if (!contentType) return json({ ok:false, error:'Only PNG, JPG, JPEG, WEBP, and GIF images are allowed.' }, 400);
  if (!file.size) return json({ ok:false, error:'The selected image is empty.' }, 400);
  if (file.size > 10 * 1024 * 1024) return json({ ok:false, error:'Image is too large. Maximum size is 10 MB.' }, 400);

  await ensureMediaTable(env);
  const id = randomId('media_');
  const filename = safeFilename(file.name);
  const key = `media/${id}/${filename}`;

  try {
    const bytes = await file.arrayBuffer();
    await bucket.put(key, bytes, {
      httpMetadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' },
      customMetadata: { uploadedBy: String(auth.user.id || ''), originalName: filename }
    });
    const url = `/api/media/file?id=${encodeURIComponent(id)}`;
    const result = await env.DB.prepare('INSERT INTO media_assets (id, filename, url, uploaded_by) VALUES (?, ?, ?, ?)')
      .bind(id, key, url, auth.user.id).run();
    if (!result?.success) {
      await bucket.delete(key).catch(() => {});
      return json({ ok:false, error:'The image reached storage but its database record could not be saved.' }, 500);
    }
    return json({ ok:true, asset:{ id, filename, key, url, content_type: contentType } }, 201);
  } catch (err) {
    return json({ ok:false, error:`Image upload failed: ${err?.message || 'Cloudflare R2 rejected the upload.'}` }, 500);
  }
}
