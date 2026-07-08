import { audit, cleanText, json, readJson, requirePermission } from '../_utils.js';

function allowedKey(key) {
  return /^[a-z0-9_-]{1,80}$/.test(key || '');
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const pageKey = cleanText(url.searchParams.get('page_key'));
  if (!allowedKey(pageKey)) return json({ ok: false, error: 'Invalid page key.' }, 400);

  const page = await env.DB.prepare(`
    SELECT page_key, title, content_html, updated_at
    FROM site_pages
    WHERE page_key = ?
  `).bind(pageKey).first();

  if (!page) return json({ ok: false, error: 'Page not found.' }, 404);
  return json({ ok: true, page });
}

export async function onRequestPut({ request, env }) {
  const auth = await requirePermission(request, env, 'edit_guides');
  if (auth.error) return auth.error;

  const data = await readJson(request);
  const pageKey = cleanText(data?.page_key);
  if (!allowedKey(pageKey)) return json({ ok: false, error: 'Invalid page key.' }, 400);

  const title = cleanText(data?.title).slice(0, 120);
  const contentHtml = String(data?.content_html || '').trim();
  if (!title) return json({ ok: false, error: 'Title is required.' }, 400);

  await env.DB.prepare(`
    INSERT INTO site_pages (page_key, title, content_html, updated_by, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(page_key) DO UPDATE SET
      title = excluded.title,
      content_html = excluded.content_html,
      updated_by = excluded.updated_by,
      updated_at = datetime('now')
  `).bind(pageKey, title, contentHtml, auth.user.id).run();

  await audit(env, auth.user.id, 'edit_site_page', 'site_pages', pageKey, `Updated ${pageKey}`);
  return json({ ok: true });
}
