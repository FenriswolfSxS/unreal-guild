import { cleanText, createSession, hashPassword, json, normalizeEmail, randomId, readJson, sessionCookie, slugify } from './_utils.js';

function validPassword(pw) {
  return typeof pw === 'string' && pw.length >= 8;
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  if (!body) return json({ ok: false, error: 'Invalid request.' }, 400);

  const accountType = body.accountType === 'user' ? 'user' : 'guild_member';
  const email = normalizeEmail(body.email);
  const username = cleanText(body.username);
  const ingameName = cleanText(body.ingameName);
  const password = String(body.password || '');
  const confirmPassword = String(body.confirmPassword || '');
  const classSlug = slugify(body.classSlug);
  const rankSlug = slugify(body.rankSlug || 'member');
  const verificationPassword = cleanText(body.verificationPassword);

  if (!email || !email.includes('@')) return json({ ok: false, error: 'Enter a valid email.' }, 400);
  if (username.length < 3) return json({ ok: false, error: 'Username must be at least 3 characters.' }, 400);
  if (ingameName.length < 2) return json({ ok: false, error: 'In-game name is required.' }, 400);
  if (!validPassword(password)) return json({ ok: false, error: 'Password must be at least 8 characters.' }, 400);
  if (password !== confirmPassword) return json({ ok: false, error: 'Passwords do not match.' }, 400);

  let classRow = null;
  let rankRow = null;
  let verified = 0;
  let requestStatus = null;

  if (accountType === 'guild_member') {
    if (!classSlug) return json({ ok: false, error: 'Class is required for Guild Members.' }, 400);
    classRow = await env.DB.prepare('SELECT id, name, slug FROM classes WHERE slug = ? AND active = 1').bind(classSlug).first();
    if (!classRow) return json({ ok: false, error: 'Choose a valid class.' }, 400);

    rankRow = await env.DB.prepare('SELECT id, name, slug, requires_verification FROM guild_ranks WHERE slug = ?').bind(rankSlug).first();
    if (!rankRow) return json({ ok: false, error: 'Choose a valid guild rank.' }, 400);

    if (rankRow.requires_verification) {
      const secret = cleanText(env.RANK_VERIFICATION_PASSWORD);
      if (!secret) return json({ ok: false, error: 'Rank verification is not configured yet.' }, 500);
      if (verificationPassword !== secret) {
        return json({ ok: false, error: `${rankRow.name} requires the guild verification password.` }, 403);
      }
      verified = 1;
      requestStatus = 'auto_approved';
    } else {
      verified = 1;
    }
  }

  const existing = await env.DB.prepare(`
    SELECT email, username, ingame_name FROM users
    WHERE lower(email) = lower(?) OR lower(username) = lower(?) OR lower(ingame_name) = lower(?)
    LIMIT 1
  `).bind(email, username, ingameName).first();

  if (existing) {
    if (existing.email.toLowerCase() === email) return json({ ok: false, error: 'That email is already registered.' }, 409);
    if (existing.username.toLowerCase() === username.toLowerCase()) return json({ ok: false, error: 'That username is already taken.' }, 409);
    return json({ ok: false, error: 'That in-game name is already registered.' }, 409);
  }

  const userId = randomId('usr_');
  const passwordData = await hashPassword(password);

  const statements = [
    env.DB.prepare(`
      INSERT INTO users (id, email, username, ingame_name, password_hash, password_salt, account_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(userId, email, username, ingameName, passwordData.hash, passwordData.salt, accountType)
  ];

  if (accountType === 'guild_member') {
    statements.push(
      env.DB.prepare(`INSERT INTO guild_members (user_id, class_id, rank_id, rank_verified) VALUES (?, ?, ?, ?)`).bind(userId, classRow.id, rankRow.id, verified)
    );
    if (rankRow.requires_verification) {
      statements.push(
        env.DB.prepare(`INSERT INTO rank_requests (id, user_id, requested_rank_id, status, resolved_at) VALUES (?, ?, ?, ?, datetime('now'))`)
          .bind(randomId('rr_'), userId, rankRow.id, requestStatus)
      );
    }
  }

  await env.DB.batch(statements);
  const token = await createSession(env, userId);

  return json({ ok: true, accountType, message: 'Account created.' }, 201, { 'set-cookie': sessionCookie(token) });
}
