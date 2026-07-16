import { json, getOptions } from './_lib.js';
export async function onRequestGet({ env }) { if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500); const r = await getOptions(env); const d = await r.json(); return json({ ok: true, ranks: d.ranks || [] }); }
