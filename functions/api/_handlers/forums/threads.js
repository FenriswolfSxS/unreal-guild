import { json, readJson, requireUser, getUserPermissions, cleanText, randomId } from '../../_lib.js';

async function ensureColumns(env, table, columns){
  const info = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
  const names = new Set((info.results || []).map(c => c.name));
  for (const [name, definition] of columns) {
    if (!names.has(name)) await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`).run();
  }
}
async function ensure(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS forum_categories (id TEXT PRIMARY KEY,title TEXT NOT NULL,type TEXT NOT NULL DEFAULT 'general',icon TEXT NOT NULL DEFAULT '💬',description TEXT NOT NULL DEFAULT '',sort_order INTEGER NOT NULL DEFAULT 0,created_by TEXT,created_at TEXT NOT NULL DEFAULT (datetime('now')))` ).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS forum_threads (id TEXT PRIMARY KEY,forum_id TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL DEFAULT '',image_url TEXT NOT NULL DEFAULT '',author_id TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')))` ).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS forum_replies (id TEXT PRIMARY KEY,thread_id TEXT NOT NULL,body TEXT NOT NULL DEFAULT '',image_url TEXT NOT NULL DEFAULT '',author_id TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')))` ).run();
  await ensureColumns(env,'forum_threads', [['body',"TEXT NOT NULL DEFAULT ''"],['image_url',"TEXT NOT NULL DEFAULT ''"],['updated_at',"TEXT NOT NULL DEFAULT ''"]]);
  await ensureColumns(env,'forum_replies', [['body',"TEXT NOT NULL DEFAULT ''"],['image_url',"TEXT NOT NULL DEFAULT ''"],['created_at',"TEXT NOT NULL DEFAULT ''"],['updated_at',"TEXT NOT NULL DEFAULT ''"]]);
}
function can(perms, slug){ return perms.includes(slug) || perms.includes('admin_dashboard') || perms.includes('moderate_posts'); }
function imageUrl(value){ const v=String(value||'').trim().slice(0,500); return v.startsWith('/api/media/file?') ? v : ''; }
export async function onRequestGet({ request, env }){
  if(!env.DB) return json({ok:false,error:'D1 binding DB is missing.'},500);
  await ensure(env);
  const forumId = cleanText(new URL(request.url).searchParams.get('forum_id'));
  if(!forumId) return json({ok:false,error:'Forum id is required.'},400);
  const rows = await env.DB.prepare(`SELECT t.id,t.forum_id,t.title,t.body,t.image_url,t.author_id,t.created_at,t.updated_at,COALESCE(u.ingame_name,u.username,'Member') AS author_name,COALESCE(c.color,'#bffcff') AS author_color,COALESCE(r.name,'Member') AS rank_name
    FROM forum_threads t JOIN users u ON u.id=t.author_id LEFT JOIN guild_members gm ON gm.user_id=u.id LEFT JOIN classes c ON c.id=gm.class_id LEFT JOIN guild_ranks r ON r.id=gm.rank_id WHERE t.forum_id=? ORDER BY t.updated_at DESC,t.created_at DESC`).bind(forumId).all();
  const threads = rows.results || [];
  for (const t of threads) {
    const rr = await env.DB.prepare(`SELECT r.id,r.thread_id,r.body,r.image_url,r.author_id,r.created_at,r.updated_at,COALESCE(u.ingame_name,u.username,'Member') AS author_name,COALESCE(c.color,'#bffcff') AS author_color,COALESCE(gr.name,'Member') AS rank_name
      FROM forum_replies r JOIN users u ON u.id=r.author_id LEFT JOIN guild_members gm ON gm.user_id=u.id LEFT JOIN classes c ON c.id=gm.class_id LEFT JOIN guild_ranks gr ON gr.id=gm.rank_id WHERE r.thread_id=? ORDER BY r.created_at ASC`).bind(t.id).all();
    t.replies = rr.results || [];
  }
  return json({ok:true, threads});
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
  const image=imageUrl(body?.image_url);
  if(!forumId||!title||(!text&&!image)) return json({ok:false,error:'Add a post title and a message or image.'},400);
  const forum=await env.DB.prepare('SELECT id FROM forum_categories WHERE id=?').bind(forumId).first();
  if(!forum) return json({ok:false,error:'Forum not found.'},404);
  const id=randomId('thread_');
  const result=await env.DB.prepare('INSERT INTO forum_threads (id,forum_id,title,body,image_url,author_id) VALUES (?,?,?,?,?,?)').bind(id,forumId,title,text,image,auth.user.id).run();
  if(!result?.success) return json({ok:false,error:'D1 did not save the post. Your draft was not cleared.'},500);
  return json({ok:true,message:'Post saved.',thread:{id,forum_id:forumId,title,body:text,image_url:image,author_id:auth.user.id}});
}
export async function onRequestPut({ request, env }){
  if(!env.DB) return json({ok:false,error:'D1 binding DB is missing.'},500);
  await ensure(env);
  const auth=await requireUser(request,env); if(auth.error) return auth.error;
  const perms=await getUserPermissions(env,auth.user.id);
  const body=await readJson(request);
  const id=cleanText(body?.id); const title=cleanText(body?.title).slice(0,160); const text=String(body?.body||'').trim().slice(0,30000); const image=imageUrl(body?.image_url);
  const thread=await env.DB.prepare('SELECT id, author_id FROM forum_threads WHERE id=?').bind(id).first();
  if(!thread) return json({ok:false,error:'Post not found.'},404);
  const own=thread.author_id===auth.user.id;
  if(!(own && perms.includes('edit_own_posts')) && !can(perms,'moderate_posts')) return json({ok:false,error:'Your rank cannot edit this post.'},403);
  if(!title||(!text&&!image)) return json({ok:false,error:'Title and a message or image are required.'},400);
  await env.DB.prepare("UPDATE forum_threads SET title=?, body=?, image_url=?, updated_at=datetime('now') WHERE id=?").bind(title,text,image,id).run();
  return json({ok:true,message:'Post updated.'});
}
export async function onRequestDelete({ request, env }){
  if(!env.DB) return json({ok:false,error:'D1 binding DB is missing.'},500);
  await ensure(env);
  const auth=await requireUser(request,env); if(auth.error) return auth.error;
  const perms=await getUserPermissions(env,auth.user.id);
  const url=new URL(request.url); const replyId=cleanText(url.searchParams.get('reply_id'));
  if(replyId){
    const reply=await env.DB.prepare('SELECT id, author_id FROM forum_replies WHERE id=?').bind(replyId).first();
    if(!reply) return json({ok:false,error:'Reply not found.'},404);
    const own=reply.author_id===auth.user.id;
    if(!(own&&perms.includes('delete_own_posts'))&&!can(perms,'moderate_posts')) return json({ok:false,error:'Your rank cannot delete this reply.'},403);
    await env.DB.prepare('DELETE FROM forum_replies WHERE id=?').bind(replyId).run(); return json({ok:true,message:'Reply deleted.'});
  }
  const id=cleanText(url.searchParams.get('id')); const thread=await env.DB.prepare('SELECT id, author_id FROM forum_threads WHERE id=?').bind(id).first();
  if(!thread) return json({ok:false,error:'Post not found.'},404);
  const own=thread.author_id===auth.user.id;
  if(!(own&&perms.includes('delete_own_posts'))&&!can(perms,'moderate_posts')) return json({ok:false,error:'Your rank cannot delete this post.'},403);
  await env.DB.batch([env.DB.prepare('DELETE FROM forum_replies WHERE thread_id=?').bind(id),env.DB.prepare('DELETE FROM forum_threads WHERE id=?').bind(id)]);
  return json({ok:true,message:'Post deleted.'});
}
