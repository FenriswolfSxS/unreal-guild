import { json, requireUser, getUserPermissions } from '../_lib.js';
function canManage(perms){ return perms.includes('manage_members') || perms.includes('admin_dashboard') || perms.includes('change_ranks'); }
export async function onRequestGet({ request, env }) {
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const perms = await getUserPermissions(env, auth.user.id);
  if (!canManage(perms)) return json({ ok:false, error:'You do not have permission to manage members.' },403);
  const members = await env.DB.prepare(`
    SELECT u.id, u.email, u.username, u.ingame_name, u.account_type, u.status, u.created_at, u.last_login,
           gm.class_id, c.name AS class_name, c.slug AS class_slug,
           gm.rank_id, r.name AS rank_name, r.slug AS rank_slug, r.sort_order AS rank_sort_order
    FROM users u
    LEFT JOIN guild_members gm ON gm.user_id = u.id
    LEFT JOIN classes c ON c.id = gm.class_id
    LEFT JOIN guild_ranks r ON r.id = gm.rank_id
    ORDER BY CASE u.status WHEN 'active' THEN 0 ELSE 1 END, COALESCE(r.sort_order, 99), lower(u.ingame_name)
  `).all();
  const ranks = await env.DB.prepare('SELECT id, name, slug, sort_order FROM guild_ranks ORDER BY sort_order').all();
  const classes = await env.DB.prepare('SELECT id, name, slug, sort_order FROM classes WHERE active=1 ORDER BY sort_order, name').all();
  return json({ ok:true, members: members.results || [], ranks: ranks.results || [], classes: classes.results || [] });
}
