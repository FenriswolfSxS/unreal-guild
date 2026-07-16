<<<<<<< HEAD
import { json } from './_utils.js';

export async function onRequestGet({ env }) {
  const rows = await env.DB.prepare(`
    SELECT u.id, u.username, u.ingame_name, gm.joined_at,
           c.name AS class_name, c.slug AS class_slug, c.color AS class_color,
           r.name AS rank_name, r.slug AS rank_slug, r.sort_order AS rank_sort_order
    FROM guild_members gm
    JOIN users u ON u.id = gm.user_id
    JOIN classes c ON c.id = gm.class_id
    JOIN guild_ranks r ON r.id = gm.rank_id
    WHERE u.status = 'active'
    ORDER BY r.sort_order ASC, lower(u.ingame_name) ASC
  `).all();
  return json({ ok: true, members: rows.results });
}
=======
import { json, roster } from './_lib.js';
export async function onRequestGet({ env }) { if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500); try { return await roster(env); } catch (err) { return json({ ok:false, error: err?.message || 'API error' },500); } }
>>>>>>> origin/main
