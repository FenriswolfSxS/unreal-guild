import { json } from './_lib.js';

export async function onRequestGet({ env }) {
  const checks = {
    function: true,
    dbBinding: !!env.DB,
    rankSecret: !!env.RANK_VERIFICATION_PASSWORD,
    schema: false,
    classes: 0,
    ranks: 0,
    users: 0,
  };

  if (!env.DB) {
    return json({ ok: false, version: '3.0.3', message: 'API works, but D1 binding DB is missing.', checks }, 500);
  }

  try {
    const classes = await env.DB.prepare('SELECT COUNT(*) AS count FROM classes').first();
    const ranks = await env.DB.prepare('SELECT COUNT(*) AS count FROM guild_ranks').first();
    const users = await env.DB.prepare('SELECT COUNT(*) AS count FROM users').first();
    checks.schema = true;
    checks.classes = classes?.count || 0;
    checks.ranks = ranks?.count || 0;
    checks.users = users?.count || 0;
  } catch (err) {
    return json({
      ok: false,
      version: '3.0.3',
      message: 'API works, but D1 schema is not ready. Run db/schema.sql in Cloudflare D1.',
      error: err?.message || 'D1 check failed',
      checks,
    }, 500);
  }

  return json({ ok: true, version: '3.0.3', message: 'API, D1 binding, and schema are working.', checks });
}
