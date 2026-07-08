import { getCurrentUser, getUserPermissions, json } from './_utils.js';

export async function onRequestGet({ request, env }) {
  const ranks = await env.DB.prepare(`
    SELECT r.id, r.name, r.slug, r.sort_order, r.requires_verification,
           p.permission_key, p.label, p.description
    FROM guild_ranks r
    LEFT JOIN rank_permissions rp ON rp.rank_id = r.id
    LEFT JOIN permissions p ON p.permission_key = rp.permission_key
    ORDER BY r.sort_order ASC, p.label ASC
  `).all();

  const grouped = [];
  const byId = new Map();
  for (const row of ranks.results || []) {
    if (!byId.has(row.id)) {
      byId.set(row.id, {
        id: row.id,
        name: row.name,
        slug: row.slug,
        sort_order: row.sort_order,
        requires_verification: !!row.requires_verification,
        permissions: []
      });
      grouped.push(byId.get(row.id));
    }
    if (row.permission_key) {
      byId.get(row.id).permissions.push({
        key: row.permission_key,
        label: row.label,
        description: row.description
      });
    }
  }

  const user = await getCurrentUser(request, env);
  const myPermissions = user ? await getUserPermissions(env, user) : [];

  return json({
    ok: true,
    signedIn: !!user,
    currentUser: user || null,
    myPermissions,
    ranks: grouped,
    communityUserPermissions: [
      { key: 'edit_own_profile', label: 'Edit Own Profile', description: 'Can manage their own basic account.' }
    ]
  });
}
