import { json } from '../_utils.js';

export async function onRequestGet({ request, env }) {
  if (!env.ASSETS) return json({ ok: false, error: 'R2 bucket is not bound yet.' }, 500);
  const url = new URL(request.url);
  const id = String(url.searchParams.get('id') || '').trim();
  if (!id) return json({ ok: false, error: 'Missing media id.' }, 400);

  const asset = await env.DB.prepare('SELECT id, filename FROM media_assets WHERE id = ?').bind(id).first();
  if (!asset) return json({ ok: false, error: 'Media item not found.' }, 404);

  const key = `media/${asset.id}/${asset.filename}`;
  const object = await env.ASSETS.get(key);
  if (!object) return json({ ok: false, error: 'File not found in R2.' }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', headers.get('cache-control') || 'public, max-age=86400');
  return new Response(object.body, { headers });
}
