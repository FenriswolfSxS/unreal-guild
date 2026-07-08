import { audit, json, readJson, requirePermission } from '../_utils.js';

export async function onRequestPost({ request, env }) {
  const auth = await requirePermission(request, env, 'admin_dashboard');
  if (auth.error) return auth.error;
  if (!env.ASSETS) return json({ ok: false, error: 'R2 bucket is not bound yet. Add an R2 binding named ASSETS.' }, 500);

  const data = await readJson(request);
  const id = String(data?.id || '').trim();
  if (!id) return json({ ok: false, error: 'Missing media id.' }, 400);

  const asset = await env.DB.prepare('SELECT id, filename FROM media_assets WHERE id = ?').bind(id).first();
  if (!asset) return json({ ok: false, error: 'Media item not found.' }, 404);

  const key = `media/${asset.id}/${asset.filename}`;
  await env.ASSETS.delete(key);
  await env.DB.prepare('DELETE FROM media_assets WHERE id = ?').bind(id).run();
  await audit(env, auth.user.id, 'delete_media', 'media_assets', id, asset.filename);
  return json({ ok: true });
}
