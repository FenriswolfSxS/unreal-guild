import { json, readJson, requireUser, getUserPermissions, slugify } from '../../_lib.js';
const ALLOWED = new Set(['conqueror','guardian','destroyer','dominator']);
async function ensure(env){
  const cols=await env.DB.prepare('PRAGMA table_info(member_builds)').all();
  const names=new Set((cols.results||[]).map(c=>c.name));
  if(!names.has('sort_order')) await env.DB.prepare("ALTER TABLE member_builds ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0").run();
}
export async function onRequestPost({request,env}){
  if(!env.DB) return json({ok:false,error:'D1 binding DB is missing.'},500);
  const auth=await requireUser(request,env); if(auth.error)return auth.error;
  const body=await readJson(request);
  const path=slugify(body?.path||'');
  const orderedIds=Array.isArray(body?.ordered_ids)?body.ordered_ids.map(String):[];
  const movedId=String(body?.moved_id||'');
  if(!ALLOWED.has(path)||!orderedIds.length||new Set(orderedIds).size!==orderedIds.length) return json({ok:false,error:'Invalid build order.'},400);
  await ensure(env);
  const rows=await env.DB.prepare(`SELECT id,created_by FROM member_builds WHERE path=? AND COALESCE(visibility,'public')='public' ORDER BY CASE WHEN sort_order>0 THEN 0 ELSE 1 END,sort_order,created_at`).bind(path).all();
  const current=rows.results||[];
  if(current.length!==orderedIds.length || current.some(r=>!orderedIds.includes(r.id))) return json({ok:false,error:'The build list changed. Refresh and try again.'},409);
  const perms=await getUserPermissions(env,auth.user.id);
  const rank=String(auth.user.rank_slug||auth.user.rank_name||'').toLowerCase();
  const leadership=['leader','deputy','officer','admin'].includes(rank)||perms.includes('moderate_builds')||perms.includes('admin_dashboard');
  const moved=current.find(r=>r.id===movedId);
  if(!leadership){
    if(!moved || moved.created_by!==auth.user.id) return json({ok:false,error:'You may only reposition your own build.'},403);
    const oldForeign=current.filter(r=>r.created_by!==auth.user.id).map(r=>r.id);
    const newForeign=orderedIds.filter(id=>current.find(r=>r.id===id)?.created_by!==auth.user.id);
    if(oldForeign.join('|')!==newForeign.join('|')) return json({ok:false,error:'Other members’ relative order cannot be changed.'},403);
  }
  const statements=orderedIds.map((id,i)=>env.DB.prepare("UPDATE member_builds SET sort_order=?,updated_at=datetime('now') WHERE id=? AND path=?").bind(i+1,id,path));
  await env.DB.batch(statements);
  return json({ok:true},200,{'cache-control':'no-store'});
}
