import { json, cleanText } from '../_lib.js';
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500);
  if (!env.ASSETS) return json({ ok:false, error:'R2 binding ASSETS is missing.' },500);
  const url = new URL(request.url);
  const id = cleanText(url.searchParams.get('id'));
  const asset = await env.DB.prepare('SELECT id, filename FROM media_assets WHERE id=?').bind(id).first();
  if (!asset) return json({ ok:false, error:'Media item not found.' },404);
  const object = await env.ASSETS.get(`media/${asset.id}/${asset.filename}`);
  if (!object) return json({ ok:false, error:'File is missing from R2.' },404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}
