function rosterRankIcon(slug) {
  return { leader: '👑', deputy: '⭐', officer: '🛡️', member: '👤' }[slug] || '👤';
}

function memberCard(member) {
  const initial = (member.ingame_name || member.username || '?').slice(0,1).toUpperCase();
  const photo = member.character_image_url
    ? `<img class="roster-character-photo" src="${member.character_image_url}" alt="${member.ingame_name} character" loading="lazy" />`
    : `<div class="roster-character-photo roster-character-placeholder" style="border-color:${member.class_color}; box-shadow:0 0 22px ${member.class_color}44">${initial}</div>`;
  return `<article class="member-card class-${member.class_slug}" style="--member-class-color:${member.class_color}">
    ${photo}
    <div class="member-card-copy">
      <h3 style="color:${member.class_color}; text-shadow:0 0 16px ${member.class_color}55">${member.ingame_name}</h3>
      <p>${member.class_name} • ${member.rank_name}</p>
    </div>
  </article>`;
}

async function loadRoster() {
  const mount = document.getElementById('dynamicRoster');
  if (!mount) return;
  try {
    const data = await fetch('/api/roster').then(r => r.json());
    if (!data.ok) throw new Error(data.error || 'Roster unavailable.');
    const groups = new Map();
    for (const m of data.members) {
      const key = m.rank_slug;
      if (!groups.has(key)) groups.set(key, { name: m.rank_name, slug: m.rank_slug, sort: m.rank_sort_order, members: [] });
      groups.get(key).members.push(m);
    }
    const sorted = [...groups.values()].sort((a,b) => a.sort - b.sort);
    if (!sorted.length) {
      mount.innerHTML = '<div class="notice-card"><h2>Guild Roster</h2><p>No guild members have registered yet.</p></div>';
      return;
    }
    mount.innerHTML = sorted.map(group => `
      <section class="roster-rank-section">
        <h2>${rosterRankIcon(group.slug)} ${group.name}</h2>
        <div class="member-grid">${group.members.map(memberCard).join('')}</div>
      </section>
    `).join('');
  } catch (err) {
    mount.innerHTML = `<div class="notice-card"><h2>Live Roster</h2><p>${err.message}</p><p>After D1 is bound and the schema is run, registered guild members will show here automatically.</p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', loadRoster);
