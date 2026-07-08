import { audit, json, randomId, requirePermission } from '../_utils.js';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

function safeFileName(name) {
  const raw = String(name || 'upload').trim().toLowerCase();
  const cleaned = raw.replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return cleaned || 'upload';
}

export async function onRequestPost({ request, env }) {
  const auth = await requirePermission(request, env, 'admin_dashboard');
  if (auth.error) return auth.error;
  if (!env.ASSETS) return json({ ok: false, error: 'R2 bucket is not bound yet. Add an R2 binding named ASSETS.' }, 500);

  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return json({ ok: false, error: 'Choose an image to upload.' }, 400);
  if (!ALLOWED_TYPES.has(file.type)) return json({ ok: false, error: 'Upload a PNG, JPG, WEBP, or GIF image.' }, 400);
  if (file.size > MAX_UPLOAD_BYTES) return json({ ok: false, error: 'Image is too large. Maximum size is 8 MB.' }, 400);

  const id = randomId('media_');
  const filename = safeFileName(file.name);
  const key = `media/${id}/${filename}`;
  const body = await file.arrayBuffer();

  await env.ASSETS.put(key, body, {
    httpMetadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable',
    },
    customMetadata: {
      uploadedBy: auth.user.id,
      originalName: file.name || filename,
    },
  });

  const url = `/api/media/file?id=${encodeURIComponent(id)}`;
  await env.DB.prepare(`
    INSERT INTO media_assets (id, filename, url, uploaded_by)
    VALUES (?, ?, ?, ?)
  `).bind(id, filename, url, auth.user.id).run();

  await audit(env, auth.user.id, 'upload_media', 'media_assets', id, filename);
  return json({ ok: true, asset: { id, filename, url } }, 201);
}
