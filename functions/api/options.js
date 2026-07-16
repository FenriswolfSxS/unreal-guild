<<<<<<< HEAD
import { json } from './_utils.js';

export async function onRequestGet({ env }) {
  const classes = await env.DB.prepare(`SELECT id, name, slug, color, tier FROM classes WHERE active = 1 ORDER BY sort_order`).all();
  const ranks = await env.DB.prepare(`SELECT id, name, slug, sort_order, requires_verification FROM guild_ranks ORDER BY sort_order`).all();
  return json({ ok: true, classes: classes.results, ranks: ranks.results });
}
=======
import { json, getOptions } from './_lib.js';
export async function onRequestGet({ env }) { if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500); return await getOptions(env); }
>>>>>>> origin/main
