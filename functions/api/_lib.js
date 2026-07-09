export const SESSION_COOKIE = 'sxs_session';
export const SESSION_DAYS = 30;

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}
export async function readJson(request) { try { return await request.json(); } catch { return null; } }
export function cleanText(value) { return String(value || '').trim(); }
export function normalizeEmail(email) { return cleanText(email).toLowerCase(); }
export function slugify(value) { return cleanText(value).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, ''); }
export function randomId(prefix = '') {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return prefix + [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}
export function getCookie(request, name) {
  const cookie = request.headers.get('cookie') || '';
  const parts = cookie.split(';').map(x => x.trim());
  const found = parts.find(x => x.startsWith(name + '='));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : '';
}
export function sessionCookie(token) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
export function b64FromBytes(bytes) {
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str);
}
export function bytesFromB64(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}
export async function hashPassword(password, salt = null) {
  const enc = new TextEncoder();
  const saltBytes = salt ? bytesFromB64(salt) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations: 120000, hash: 'SHA-256' }, key, 256);
  return { salt: b64FromBytes(saltBytes), hash: b64FromBytes(new Uint8Array(bits)) };
}
export async function verifyPassword(password, salt, expectedHash) {
  const result = await hashPassword(password, salt);
  return result.hash === expectedHash;
}
export async function createSession(env, userId) {
  const token = randomId('sess_');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').bind(token, userId, expires).run();
  return token;
}
export async function getCurrentUser(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  return await env.DB.prepare(`
    SELECT u.id, u.email, u.username, u.ingame_name, u.account_type, u.status,
           gm.class_id, c.name AS class_name, c.slug AS class_slug, c.color AS class_color,
           gm.rank_id, r.name AS rank_name, r.slug AS rank_slug, r.sort_order AS rank_sort_order,
           gm.rank_verified
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN guild_members gm ON gm.user_id = u.id
    LEFT JOIN classes c ON c.id = gm.class_id
    LEFT JOIN guild_ranks r ON r.id = gm.rank_id
    WHERE s.token = ? AND s.expires_at > datetime('now') AND u.status = 'active'
  `).bind(token).first();
}
export async function getUserPermissions(env, userId) {
  if (!userId) return [];
  const rows = await env.DB.prepare(`
    SELECT p.slug
    FROM users u
    JOIN guild_members gm ON gm.user_id = u.id
    JOIN rank_permissions rp ON rp.rank_id = gm.rank_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE u.id = ? AND u.status = 'active'
  `).bind(userId).all();
  return (rows.results || []).map(r => r.slug);
}
export async function requireUser(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user) return { error: json({ ok: false, error: 'You need to sign in first.' }, 401) };
  return { user };
}

export async function getOptions(env) {
  const classes = await env.DB.prepare('SELECT id, name, slug, color, tier FROM classes WHERE active = 1 ORDER BY sort_order, name').all();
  const ranks = await env.DB.prepare('SELECT id, name, slug, sort_order, requires_verification FROM guild_ranks ORDER BY sort_order').all();
  return json({ ok: true, classes: classes.results || [], ranks: ranks.results || [] });
}

export async function register(request, env) {
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
  if (password.length < 8) return json({ ok: false, error: 'Password must be at least 8 characters.' }, 400);
  if (password !== confirmPassword) return json({ ok: false, error: 'Passwords do not match.' }, 400);

  let classRow = null, rankRow = null, verified = 0, requestStatus = null;
  if (accountType === 'guild_member') {
    if (!classSlug) return json({ ok: false, error: 'Class is required for Guild Members.' }, 400);
    classRow = await env.DB.prepare('SELECT id, name, slug FROM classes WHERE slug = ? AND active = 1').bind(classSlug).first();
    if (!classRow) return json({ ok: false, error: 'Choose a valid class.' }, 400);
    rankRow = await env.DB.prepare('SELECT id, name, slug, requires_verification FROM guild_ranks WHERE slug = ?').bind(rankSlug).first();
    if (!rankRow) return json({ ok: false, error: 'Choose a valid guild rank.' }, 400);
    if (rankRow.requires_verification) {
      const secret = cleanText(env.RANK_VERIFICATION_PASSWORD);
      if (!secret) return json({ ok: false, error: 'Rank verification is not configured yet.' }, 500);
      if (verificationPassword !== secret) return json({ ok: false, error: `${rankRow.name} requires the guild verification password.` }, 403);
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
    if (String(existing.email).toLowerCase() === email) return json({ ok: false, error: 'That email is already registered.' }, 409);
    if (String(existing.username).toLowerCase() === username.toLowerCase()) return json({ ok: false, error: 'That username is already taken.' }, 409);
    return json({ ok: false, error: 'That in-game name is already registered.' }, 409);
  }
  const userId = randomId('usr_');
  const pw = await hashPassword(password);
  const statements = [env.DB.prepare(`
    INSERT INTO users (id, email, username, ingame_name, password_hash, password_salt, account_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(userId, email, username, ingameName, pw.hash, pw.salt, accountType)];
  if (accountType === 'guild_member') {
    statements.push(env.DB.prepare('INSERT INTO guild_members (user_id, class_id, rank_id, rank_verified) VALUES (?, ?, ?, ?)').bind(userId, classRow.id, rankRow.id, verified));
    if (rankRow.requires_verification) {
      statements.push(env.DB.prepare('INSERT INTO rank_requests (id, user_id, requested_rank_id, status, resolved_at) VALUES (?, ?, ?, ?, datetime(\'now\'))').bind(randomId('rr_'), userId, rankRow.id, requestStatus));
    }
  }
  await env.DB.batch(statements);
  const token = await createSession(env, userId);
  return json({ ok: true, accountType, message: 'Account created.' }, 201, { 'set-cookie': sessionCookie(token) });
}

export async function login(request, env) {
  const body = await readJson(request);
  const login = cleanText(body?.login).toLowerCase();
  const password = String(body?.password || '');
  if (!login || !password) return json({ ok: false, error: 'Email/username and password are required.' }, 400);
  const user = await env.DB.prepare(`SELECT * FROM users WHERE lower(email)=? OR lower(username)=? OR lower(ingame_name)=? LIMIT 1`).bind(login, login, login).first();
  if (!user || user.status !== 'active') return json({ ok: false, error: 'Invalid login.' }, 401);
  const ok = await verifyPassword(password, user.password_salt, user.password_hash);
  if (!ok) return json({ ok: false, error: 'Invalid login.' }, 401);
  await env.DB.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').bind(user.id).run();
  const token = await createSession(env, user.id);
  return json({ ok: true, message: 'Signed in.' }, 200, { 'set-cookie': sessionCookie(token) });
}

export async function logout(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie() });
}

export async function me(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ ok: true, signedIn: false, permissions: [] });
  const permissions = await getUserPermissions(env, user.id);
  return json({ ok: true, signedIn: true, user, permissions });
}

export async function roster(env) {
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
  return json({ ok: true, members: rows.results || [] });
}

export async function profile(request, env) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const body = await readJson(request);
  const ingameName = cleanText(body?.ingameName);
  const classSlug = slugify(body?.classSlug);
  if (ingameName.length < 2) return json({ ok: false, error: 'In-game name is required.' }, 400);
  const duplicate = await env.DB.prepare('SELECT id FROM users WHERE lower(ingame_name) = lower(?) AND id != ? LIMIT 1').bind(ingameName, auth.user.id).first();
  if (duplicate) return json({ ok: false, error: 'That in-game name is already registered.' }, 409);
  const statements = [env.DB.prepare('UPDATE users SET ingame_name = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(ingameName, auth.user.id)];
  if (auth.user.account_type === 'guild_member') {
    const classRow = await env.DB.prepare('SELECT id FROM classes WHERE slug = ? AND active = 1').bind(classSlug).first();
    if (!classRow) return json({ ok: false, error: 'Choose a valid class.' }, 400);
    statements.push(env.DB.prepare('UPDATE guild_members SET class_id = ?, updated_at = datetime(\'now\') WHERE user_id = ?').bind(classRow.id, auth.user.id));
  }
  await env.DB.batch(statements);
  return json({ ok: true, message: 'Profile updated.' });
}

