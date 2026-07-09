import { json, readJson, requireUser, getUserPermissions, cleanText, randomId } from '../../_lib.js';

async function ensure(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS forum_threads (id TEXT PRIMARY KEY,forum_id TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL DEFAULT '',author_id TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')))` ).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS forum_replies (id TEXT PRIMARY KEY,thread_id TEXT NOT NULL,body TEXT NOT NULL DEFAULT '',author_id TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')))` ).run();
  const info = await env.DB.prepare(`PRAGMA table_info(forum_replies)`).all();
  const cols = new Set((info.results || []).map(c => c.name));
  for (const [name, type] of [['thread_id','TEXT'],['body','TEXT'],['author_id','TEXT'],['created_at','TEXT'],['updated_at','TEXT']]) {
    if (!cols.has(name)) {
      const def = name.endsWith('_at') ? "TEXT DEFAULT (datetime('now'))" : type;
      await env.DB.prepare(`ALTER TABLE forum_replies ADD COLUMN ${name} ${def}`).run();
    }
  }
}
function canPost(perms){ return perms.includes('create_posts') || perms.includes('admin_dashboard') || perms.includes('moderate_posts'); }

export async function onRequestPost({ request, env }){
  if(!env.DB) return json({ok:false,error:'D1 binding DB is missing.'},500);
  await ensure(env);
  const auth = await requireUser(request, env); if(auth.error) return auth.error;
  const perms = await getUserPermissions(env, auth.user.id);
  if(!canPost(perms)) return json({ok:false,error:'Your rank cannot reply in the forums.'},403);
  const data = await readJson(request);
  const url = new URL(request.url);
  const threadId = cleanText(data?.thread_id || data?.threadId || data?.post_id || data?.postId || url.searchParams.get('thread_id') || url.searchParams.get('threadId') || url.searchParams.get('post_id'));
  const text = String(data?.body || data?.message || data?.reply || data?.text || '').trim().slice(0,30000);
  if(!threadId) return json({ok:false,error:'Post id is required to reply.'},400);
  if(!text) return json({ok:false,error:'Write a reply first.'},400);
  const thread = await env.DB.prepare('SELECT id FROM forum_threads WHERE id=?').bind(threadId).first();
  if(!thread) return json({ok:false,error:'Post not found.'},404);
  const id = randomId('reply_');
  await env.DB.prepare('INSERT INTO forum_replies (id,thread_id,body,author_id) VALUES (?,?,?,?)').bind(id,threadId,text,auth.user.id).run();
  await env.DB.prepare('UPDATE forum_threads SET updated_at=datetime(\'now\') WHERE id=?').bind(threadId).run();
  return json({ok:true,message:'Reply saved.',reply:{id,thread_id:threadId,body:text,author_id:auth.user.id}});
}
