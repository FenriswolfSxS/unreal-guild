import { json, readJson, requireUser, getUserPermissions, cleanText } from '../_lib.js';
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500);
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const perms = await getUserPermissions(env, auth.user.id);
  if (!perms.includes('admin_dashboard')) return json({ ok:false, error:'You do not have permission to delete media.' },403);
  const body = await readJson(request); const id = cleanText(body?.id);
  const asset = await env.DB.prepare('SELECT id, filename FROM media_assets WHERE id=?').bind(id).first();
  if (!asset) return json({ ok:false, error:'Media item not found.' },404);
  if (env.ASSETS) await env.ASSETS.delete(`media/${asset.id}/${asset.filename}`);
  await env.DB.prepare('DELETE FROM media_assets WHERE id=?').bind(id).run();
  return json({ ok:true, message:'Media item deleted.' });
}
