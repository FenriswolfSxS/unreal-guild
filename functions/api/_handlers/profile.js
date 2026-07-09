import { json, profile } from '../_lib.js';
export async function onRequestPost({ request, env }) { if (!env.DB) return json({ ok:false, error:'D1 binding DB is missing.' },500); try { return await profile(request, env); } catch (err) { return json({ ok:false, error: err?.message || 'API error' },500); } }
