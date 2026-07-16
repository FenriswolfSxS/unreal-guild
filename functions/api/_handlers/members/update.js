import { json, readJson, requireUser, getUserPermissions, cleanText } from '../../_lib.js';
function canManage(perms){ return perms.includes('manage_members') || perms.includes('admin_dashboard') || perms.includes('change_ranks'); }
export async function onRequestPost({ request, env }) {
  const auth = await requireUser(request, env); if (auth.error) return auth.error;
  const perms = await getUserPermissions(env, auth.user.id);
  if (!canManage(perms)) return json({ ok:false, error:'You do not have permission to manage members.' },403);
  const body = await readJson(request);
  const userId = cleanText(body?.user_id);
  if (!userId) return json({ ok:false, error:'Missing member.' },400);
  if (userId === auth.user.id && body.status === 'suspended') return json({ ok:false, error:'You cannot remove your own access while signed in.' },400);
  const target = await env.DB.prepare(`
    SELECT u.id, u.account_type, gm.rank_id, r.slug AS rank_slug, r.name AS rank_name, r.sort_order AS rank_sort_order
    FROM users u
    LEFT JOIN guild_members gm ON gm.user_id = u.id
    LEFT JOIN guild_ranks r ON r.id = gm.rank_id
    WHERE u.id=?
  `).bind(userId).first();
  if (!target) return json({ ok:false, error:'Member not found.' },404);
  const protectedRanks = new Set(['leader','deputy','officer','admin']);
  const targetRankSlug = String(target.rank_slug || '').toLowerCase();
  if (protectedRanks.has(targetRankSlug)) {
    return json({ ok:false, error:'Leadership accounts cannot be changed from Member Management.' },403);
  }
  const status = body.status === 'suspended' ? 'suspended' : 'active';
  const accountType = body.account_type === 'user' ? 'user' : 'guild_member';
  const rankId = Number(body.rank_id || 0);
  const classId = Number(body.class_id || 0);
  const stmts = [env.DB.prepare('UPDATE users SET status=?, account_type=?, updated_at=datetime(\'now\') WHERE id=?').bind(status, accountType, userId)];
  if (accountType === 'guild_member') {
    const rank = await env.DB.prepare('SELECT id, slug, name FROM guild_ranks WHERE id=?').bind(rankId).first();
    const cls = await env.DB.prepare('SELECT id FROM classes WHERE id=? AND active=1').bind(classId).first();
    if (!rank || !cls) return json({ ok:false, error:'Choose a valid rank and class.' },400);
    if (protectedRanks.has(String(rank.slug || '').toLowerCase())) {
      return json({ ok:false, error:'Leadership ranks cannot be assigned from Member Management.' },403);
    }
    stmts.push(env.DB.prepare(`INSERT INTO guild_members (user_id, class_id, rank_id, rank_verified, updated_at)
      VALUES (?, ?, ?, 1, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET class_id=excluded.class_id, rank_id=excluded.rank_id, rank_verified=1, updated_at=datetime('now')`).bind(userId, cls.id, rank.id));
  } else {
    stmts.push(env.DB.prepare('DELETE FROM guild_members WHERE user_id=?').bind(userId));
  }
  if (status === 'suspended') stmts.push(env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(userId));
  await env.DB.batch(stmts);
  return json({ ok:true, message:'Member updated.' });
}
