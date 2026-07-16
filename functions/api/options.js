import { json, getOptions } from './_lib.js';
export async function onRequestGet({ env }) { if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500); return await getOptions(env); }
