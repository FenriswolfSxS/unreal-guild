import { json, requireUser, getUserPermissions, randomId, cleanText } from '../_lib.js';
const ALLOWED = new Set(['image/png','image/jpeg','image/webp','image/gif']);
function safeFilename(name) { return cleanText(name).replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').slice(0,120) || 'image.png'; }
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500);
  if (!env.ASSETS) return json({ ok:false, error:'R2 binding ASSETS is missing. Add an R2 bucket binding named ASSETS in Cloudflare Pages settings.' },500);
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const perms = await getUserPermissions(env, auth.user.id);
  if (!(perms.includes('admin_dashboard') || perms.includes('manage_site_settings') || perms.includes('edit_guides') || perms.includes('edit_home'))) return json({ ok:false, error:'You do not have permission to upload media.' },403);
  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return json({ ok:false, error:'Choose an image file first.' },400);
  if (!ALLOWED.has(file.type)) return json({ ok:false, error:'Only PNG, JPG, WEBP, and GIF images are allowed.' },400);
  if (file.size > 10 * 1024 * 1024) return json({ ok:false, error:'Image is too large. Max size is 10 MB.' },400);
  const id = randomId('media_');
  const filename = safeFilename(file.name);
  const key = `media/${id}/${filename}`;
  await env.ASSETS.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  const url = `/api/media/file?id=${encodeURIComponent(id)}`;
  await env.DB.prepare('INSERT INTO media_assets (id, filename, url, uploaded_by) VALUES (?, ?, ?, ?)').bind(id, filename, url, auth.user.id).run();
  return json({ ok:true, asset:{ id, filename, url } },201);
}
