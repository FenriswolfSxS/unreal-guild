import { json, readJson, requireUser, getUserPermissions, cleanText, randomId } from '../../_lib.js';
async function ensure(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS forum_replies (id TEXT PRIMARY KEY,thread_id TEXT NOT NULL,body TEXT NOT NULL DEFAULT '',image_url TEXT NOT NULL DEFAULT '',author_id TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')),updated_at TEXT NOT NULL DEFAULT (datetime('now')))` ).run();
  const info=await env.DB.prepare('PRAGMA table_info(forum_replies)').all(); const cols=new Set((info.results||[]).map(c=>c.name));
  if(!cols.has('image_url')) await env.DB.prepare("ALTER TABLE forum_replies ADD COLUMN image_url TEXT NOT NULL DEFAULT ''").run();
}
function canPost(p){return p.includes('create_posts')||p.includes('admin_dashboard')||p.includes('moderate_posts');}
function imageUrl(v){v=String(v||'').trim().slice(0,500);return v.startsWith('/api/media/file?')?v:'';}
export async function onRequestPost({request,env}){
  if(!env.DB)return json({ok:false,error:'D1 binding DB is missing.'},500); await ensure(env);
  const auth=await requireUser(request,env);if(auth.error)return auth.error;const perms=await getUserPermissions(env,auth.user.id);if(!canPost(perms))return json({ok:false,error:'Your rank cannot reply in the forums.'},403);
  const data=await readJson(request);const threadId=cleanText(data?.thread_id||data?.threadId||data?.post_id);const text=String(data?.body||data?.message||'').trim().slice(0,30000);const image=imageUrl(data?.image_url);
  if(!threadId)return json({ok:false,error:'Post id is required to reply.'},400);if(!text&&!image)return json({ok:false,error:'Write a reply or attach an image first.'},400);
  const thread=await env.DB.prepare('SELECT id FROM forum_threads WHERE id=?').bind(threadId).first();if(!thread)return json({ok:false,error:'Post not found.'},404);
  const id=randomId('reply_');const result=await env.DB.prepare('INSERT INTO forum_replies (id,thread_id,body,image_url,author_id) VALUES (?,?,?,?,?)').bind(id,threadId,text,image,auth.user.id).run();
  if(!result?.success)return json({ok:false,error:'D1 did not save the reply. Your draft was not cleared.'},500);
  await env.DB.prepare("UPDATE forum_threads SET updated_at=datetime('now') WHERE id=?").bind(threadId).run();
  return json({ok:true,message:'Reply saved.',reply:{id,thread_id:threadId,body:text,image_url:image,author_id:auth.user.id,author_name:auth.user.ingame_name||auth.user.username||'Member',created_at:'just now'}});
}
