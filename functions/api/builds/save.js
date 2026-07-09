import { json, readJson, requireUser, cleanText, slugify, randomId } from '../_lib.js';
const ALLOWED = new Set(['conqueror','guardian','destroyer','dominator']);
async function ensureBuildTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS member_builds (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    class_name TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '',
    import_code TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
}
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500);
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const body = await readJson(request);
  const path = slugify(body?.path || '');
  if (!ALLOWED.has(path)) return json({ ok:false, error:'Unknown build page.' },400);
  const title = cleanText(body?.title).slice(0,120);
  if (!title) return json({ ok:false, error:'Build title is required.' },400);
  const className = cleanText(body?.class_name).slice(0,60);
  const tags = cleanText(body?.tags).slice(0,160);
  const importCode = String(body?.import_code || '').trim().slice(0,20000);
  const notes = String(body?.notes || '').trim().slice(0,20000);
  const imageUrl = String(body?.image_url || '').trim().slice(0,500);
  await ensureBuildTable(env);
  const id = randomId('build_');
  await env.DB.prepare(`INSERT INTO member_builds (id, path, class_name, title, tags, import_code, notes, image_url, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, path, className, title, tags, importCode, notes, imageUrl, auth.user.id).run();
  return json({ ok:true, message:'Build saved.', build:{ id, path, class_name: className, title, tags, import_code: importCode, notes, image_url: imageUrl } });
}
