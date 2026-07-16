import { json, requireUser, getUserPermissions, cleanText } from '../../_lib.js';
async function ensure(env){ await env.DB.prepare(`CREATE TABLE IF NOT EXISTS member_builds (id TEXT PRIMARY KEY,path TEXT NOT NULL,class_name TEXT NOT NULL DEFAULT '',title TEXT NOT NULL,tags TEXT NOT NULL DEFAULT '',import_code TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',image_url TEXT NOT NULL DEFAULT '',build_json TEXT NOT NULL DEFAULT '',visibility TEXT NOT NULL DEFAULT 'public',created_by TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT (datetime('now')),created_at TEXT NOT NULL DEFAULT (datetime('now')))` ).run(); }
export async function onRequestDelete({request,env}){
  if(!env.DB)return json({ok:false,error:'D1 binding DB is missing.'},500);await ensure(env);
  const auth=await requireUser(request,env);if(auth.error)return auth.error;
  const perms=await getUserPermissions(env,auth.user.id);const id=cleanText(new URL(request.url).searchParams.get('id'));
  if(!id)return json({ok:false,error:'Build id is required.'},400);
  const build=await env.DB.prepare('SELECT id,created_by FROM member_builds WHERE id=?').bind(id).first();
  if(!build)return json({ok:false,error:'Build not found.'},404);
  const own=build.created_by===auth.user.id;
  const rank=String(auth.user.rank_slug||auth.user.rank_name||'').trim().toLowerCase();
  const leadership=['leader','deputy','officer','admin'].includes(rank);
  const allowed=leadership||(own&&perms.includes('delete_own_builds'))||perms.includes('moderate_builds')||perms.includes('admin_dashboard');
  if(!allowed)return json({ok:false,error:'You do not have permission to delete this build.'},403);
  const result=await env.DB.prepare('DELETE FROM member_builds WHERE id=?').bind(id).run();
  if(!result?.success)return json({ok:false,error:'The build could not be deleted.'},500);
  return json({ok:true,message:'Build deleted.'});
}
