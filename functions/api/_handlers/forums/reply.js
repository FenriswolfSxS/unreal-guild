import { json, readJson, requireUser, cleanText, randomId } from '../../_lib.js';

async function ensureReplyTable(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS forum_replies (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    author_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`).run();
  const info=await env.DB.prepare('PRAGMA table_info(forum_replies)').all();
  const cols=new Set((info.results||[]).map(c=>c.name));
  if(!cols.has('body')) await env.DB.prepare("ALTER TABLE forum_replies ADD COLUMN body TEXT NOT NULL DEFAULT ''").run();
  if(!cols.has('image_url')) await env.DB.prepare("ALTER TABLE forum_replies ADD COLUMN image_url TEXT NOT NULL DEFAULT ''").run();
  if(!cols.has('created_at')) await env.DB.prepare("ALTER TABLE forum_replies ADD COLUMN created_at TEXT NOT NULL DEFAULT ''").run();
  if(!cols.has('updated_at')) await env.DB.prepare("ALTER TABLE forum_replies ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''").run();
}
function imageUrl(value){const v=String(value||'').trim().slice(0,500);return v.startsWith('/api/media/file?')?v:'';}
export async function onRequestPost({request,env}){
  try{
    if(!env.DB)return json({ok:false,error:'D1 binding DB is missing.'},500);
    await ensureReplyTable(env);
    const auth=await requireUser(request,env);if(auth.error)return auth.error;
    const body=await readJson(request);
    const threadId=cleanText(body?.thread_id);
    const text=String(body?.body||'').trim().slice(0,30000);
    const image=imageUrl(body?.image_url);
    if(!threadId)return json({ok:false,error:'Post id is required to reply.'},400);
    if(!text&&!image)return json({ok:false,error:'Write a reply or attach an image first.'},400);
    const thread=await env.DB.prepare('SELECT id FROM forum_threads WHERE id=?').bind(threadId).first();
    if(!thread)return json({ok:false,error:'Post not found.'},404);
    const id=randomId('reply_');
    const now=new Date().toISOString();
    const result=await env.DB.prepare('INSERT INTO forum_replies (id,thread_id,body,image_url,author_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').bind(id,threadId,text,image,auth.user.id,now,now).run();
    if(!result?.success)return json({ok:false,error:'D1 did not save the reply. Your draft is still here.'},500);
    await env.DB.prepare('UPDATE forum_threads SET updated_at=? WHERE id=?').bind(now,threadId).run();
    return json({ok:true,message:'Reply saved.',reply:{id,thread_id:threadId,body:text,image_url:image,author_id:auth.user.id,author_name:auth.user.ingame_name||auth.user.username||'Member',created_at:now}});
  }catch(err){
    return json({ok:false,error:`Reply could not be saved: ${err?.message||'Unknown database error.'}`},500);
  }
}
