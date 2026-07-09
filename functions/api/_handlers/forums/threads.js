import { json, readJson, requireUser, getUserPermissions, cleanText, randomId } from '../../_lib.js';
async function ensure(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS forum_categories (id TEXT PRIMARY KEY,title TEXT NOT NULL,type TEXT NOT NULL DEFAULT 'general',icon TEXT NOT NULL DEFAULT '💬',description TEXT NOT NULL DEFAULT '',sort_order INTEGER NOT NULL DEFAULT 0,created_by TEXT,created_at TEXT NOT NULL DEFAULT (datetime('now')))` ).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS forum_threads (id TEXT PRIMARY KEY,forum_id TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL DEFAULT '',author_id TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')))` ).run();
}
function can(perms, slug){ return perms.includes(slug) || perms.includes('admin_dashboard') || perms.includes('moderate_posts'); }
export async function onRequestGet({ request, env }){
  if(!env.DB) return json({ok:false,error:'D1 binding DB is missing.'},500);
  await ensure(env);
  const forumId = cleanText(new URL(request.url).searchParams.get('forum_id'));
  if(!forumId) return json({ok:false,error:'Forum id is required.'},400);
  const rows = await env.DB.prepare(`SELECT t.id,t.forum_id,t.title,t.body,t.author_id,t.created_at,t.updated_at,COALESCE(u.ingame_name,u.username,'Member') AS author_name
    FROM forum_threads t JOIN users u ON u.id=t.author_id WHERE t.forum_id=? ORDER BY t.created_at DESC`).bind(forumId).all();
  return json({ok:true, threads: rows.results || []});
}
export async function onRequestPost({ request, env }){
  if(!env.DB) return json({ok:false,error:'D1 binding DB is missing.'},500);
  await ensure(env);
  const auth=await requireUser(request,env); if(auth.error) return auth.error;
  const perms=await getUserPermissions(env,auth.user.id);
  if(!can(perms,'create_posts')) return json({ok:false,error:'Your rank cannot create forum posts.'},403);
  const body=await readJson(request);
  const forumId=cleanText(body?.forum_id);
  const title=cleanText(body?.title).slice(0,160);
  const text=String(body?.body||'').trim().slice(0,30000);
  if(!forumId||!title||!text) return json({ok:false,error:'Forum, title, and message are required.'},400);
  const forum=await env.DB.prepare('SELECT id FROM forum_categories WHERE id=?').bind(forumId).first();
  if(!forum) return json({ok:false,error:'Forum not found.'},404);
  const id=randomId('thread_');
  await env.DB.prepare('INSERT INTO forum_threads (id,forum_id,title,body,author_id) VALUES (?,?,?,?,?)').bind(id,forumId,title,text,auth.user.id).run();
  return json({ok:true,message:'Post saved.',thread:{id,forum_id:forumId,title,body:text,author_id:auth.user.id}});
}
export async function onRequestPut({ request, env }){
  if(!env.DB) return json({ok:false,error:'D1 binding DB is missing.'},500);
  await ensure(env);
  const auth=await requireUser(request,env); if(auth.error) return auth.error;
  const perms=await getUserPermissions(env,auth.user.id);
  const body=await readJson(request);
  const id=cleanText(body?.id);
  const title=cleanText(body?.title).slice(0,160);
  const text=String(body?.body||'').trim().slice(0,30000);
  const thread=await env.DB.prepare('SELECT id, author_id FROM forum_threads WHERE id=?').bind(id).first();
  if(!thread) return json({ok:false,error:'Post not found.'},404);
  const own=thread.author_id===auth.user.id;
  if(!(own && perms.includes('edit_own_posts')) && !can(perms,'moderate_posts')) return json({ok:false,error:'Your rank cannot edit this post.'},403);
  if(!title||!text) return json({ok:false,error:'Title and message are required.'},400);
  await env.DB.prepare('UPDATE forum_threads SET title=?, body=?, updated_at=datetime(\'now\') WHERE id=?').bind(title,text,id).run();
  return json({ok:true,message:'Post updated.'});
}
export async function onRequestDelete({ request, env }){
  if(!env.DB) return json({ok:false,error:'D1 binding DB is missing.'},500);
  await ensure(env);
  const auth=await requireUser(request,env); if(auth.error) return auth.error;
  const perms=await getUserPermissions(env,auth.user.id);
  const id=cleanText(new URL(request.url).searchParams.get('id'));
  const thread=await env.DB.prepare('SELECT id, author_id FROM forum_threads WHERE id=?').bind(id).first();
  if(!thread) return json({ok:false,error:'Post not found.'},404);
  const own=thread.author_id===auth.user.id;
  if(!(own && perms.includes('delete_own_posts')) && !can(perms,'moderate_posts')) return json({ok:false,error:'Your rank cannot delete this post.'},403);
  await env.DB.prepare('DELETE FROM forum_threads WHERE id=?').bind(id).run();
  return json({ok:true,message:'Post deleted.'});
}
