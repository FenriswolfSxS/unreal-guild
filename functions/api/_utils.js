const SESSION_COOKIE = 'sxs_session';
const SESSION_DAYS = 30;

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headers,
    },
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function cleanText(value) {
  return String(value || '').trim();
}

export function slugify(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
}

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

export async function hashPassword(password, salt = null) {
  const enc = new TextEncoder();
  const saltBytes = salt ? Uint8Array.from(atob(salt), c => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 120000, hash: 'SHA-256' },
    key,
    256
  );
  const hashBytes = new Uint8Array(bits);
  const saltB64 = btoa(String.fromCharCode(...saltBytes));
  const hashB64 = btoa(String.fromCharCode(...hashBytes));
  return { salt: saltB64, hash: hashB64 };
}

export async function verifyPassword(password, salt, expectedHash) {
  const result = await hashPassword(password, salt);
  return result.hash === expectedHash;
}

export async function createSession(env, userId) {
  const token = randomId('sess_');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(token, userId, expires)
    .run();
  return token;
}

export async function getCurrentUser(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const row = await env.DB.prepare(`
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
  return row || null;
}

export async function requireUser(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user) return { error: json({ ok: false, error: 'You need to sign in first.' }, 401) };
  return { user };
}

export async function getUserPermissions(env, user) {
  if (!user || user.account_type !== 'guild_member' || !user.rank_id || !user.rank_verified) {
    return [];
  }
  const rows = await env.DB.prepare(`
    SELECT p.permission_key, p.label, p.description
    FROM rank_permissions rp
    JOIN permissions p ON p.permission_key = rp.permission_key
    WHERE rp.rank_id = ?
    ORDER BY p.label
  `).bind(user.rank_id).all();
  return rows.results || [];
}

export async function userHasPermission(env, user, permissionKey) {
  if (!user || user.account_type !== 'guild_member' || !user.rank_verified) return false;
  const row = await env.DB.prepare(`
    SELECT 1 AS allowed
    FROM rank_permissions
    WHERE rank_id = ? AND permission_key = ?
    LIMIT 1
  `).bind(user.rank_id, permissionKey).first();
  return !!row;
}

export async function requirePermission(request, env, permissionKey) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth;
  const allowed = await userHasPermission(env, auth.user, permissionKey);
  if (!allowed) return { error: json({ ok: false, error: 'You do not have permission to do that.' }, 403) };
  return auth;
}
