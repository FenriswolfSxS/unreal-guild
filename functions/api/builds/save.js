import { json, readJson, requireUser, cleanText, slugify, randomId } from '../_lib.js';
const ALLOWED = new Set(['conqueror','guardian','destroyer','dominator']);
const PATH_MAP = { duelist:'conqueror', knight:'guardian', sorcerer:'destroyer', sage:'dominator', conqueror:'conqueror', guardian:'guardian', destroyer:'destroyer', dominator:'dominator' };
function normalizeBuildPath(value){
  let raw = String(value || '').trim().toLowerCase();
  raw = raw.split('?')[0].split('#')[0].replace(/^\/+/, '').replace(/\/+$/, '');
  raw = raw.replace(/\.html?$/, '').replace(/-builds$/, '');
  const key = slugify(raw || value || '');
  return PATH_MAP[key] || key;
}
async function ensureBuildTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS member_builds (
    id TEXT PRIMARY KEY, path TEXT NOT NULL, class_name TEXT NOT NULL DEFAULT '', title TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '', import_code TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '', build_json TEXT NOT NULL DEFAULT '', visibility TEXT NOT NULL DEFAULT 'public',
    created_by TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')), created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
  const cols = await env.DB.prepare('PRAGMA table_info(member_builds)').all();
  const names = new Set((cols.results || []).map(c => c.name));
  if (!names.has('build_json')) await env.DB.prepare("ALTER TABLE member_builds ADD COLUMN build_json TEXT NOT NULL DEFAULT ''").run();
  if (!names.has('visibility')) await env.DB.prepare("ALTER TABLE member_builds ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public'").run();
  if (!names.has('sort_order')) await env.DB.prepare("ALTER TABLE member_builds ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0").run();
}
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing. Expected binding name: DB.' },500);
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const body = await readJson(request);
  const path = normalizeBuildPath(body?.path || '');
  if (!ALLOWED.has(path)) return json({ ok:false, error:'Unknown build page.' },400);
  const title = cleanText(body?.title).slice(0,120);
  if (!title) return json({ ok:false, error:'Build title is required.' },400);
  await ensureBuildTable(env);
  const className = cleanText(body?.class_name).slice(0,60);
  const tags = cleanText(body?.tags).slice(0,160);
  const importCode = String(body?.import_code || '').trim().slice(0,20000);
  const notes = String(body?.notes || '').trim().slice(0,20000);
  const imageUrl = String(body?.image_url || '').trim().slice(0,500);
  const buildJson = body?.build_json ? JSON.stringify(body.build_json).slice(0,120000) : '';
  const visibility = body?.visibility === 'private' ? 'private' : 'public';
  const next = await env.DB.prepare('SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM member_builds WHERE path=?').bind(path).first();
  const id = randomId('build_');
  const result = await env.DB.prepare(`INSERT INTO member_builds
    (id,path,class_name,title,tags,import_code,notes,image_url,build_json,visibility,created_by,sort_order)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id,path,className,title,tags,importCode,notes,imageUrl,buildJson,visibility,auth.user.id,Number(next?.n||1)).run();
  if (!result?.success) return json({ ok:false, error:'D1 did not save the build.' },500);
  const saved = await env.DB.prepare('SELECT id,path,class_name,title,visibility,created_by,sort_order FROM member_builds WHERE id=?').bind(id).first();
  if (!saved) return json({ ok:false, error:'The build insert could not be verified.' },500);
  return json({ ok:true, message: visibility === 'private' ? 'Saved to My Builds.' : 'Published to class build page.', build:saved }, 200, { 'cache-control':'no-store' });
}
