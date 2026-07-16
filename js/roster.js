function rosterInitial(member) {
  return (member.ingame_name || member.username || '?').slice(0, 1).toUpperCase();
}

function rosterMemberRow(member) {
  const color = member.class_color || '#8eefff';
  const name = member.ingame_name || member.username || 'Unknown Member';
  const image = member.character_image_url
    ? `<img class="roster-avatar-image" src="${member.character_image_url}" alt="${name} character" loading="lazy" />`
    : `<span class="member-avatar roster-avatar-placeholder" aria-hidden="true">${rosterInitial(member)}</span>`;

  return `<article class="roster-member-row" style="--member-class-color:${color}">
    <div class="roster-member-identity">
      ${image}
      <span class="roster-member-name-wrap">
        <strong style="color:${color}; text-shadow:0 0 14px ${color}44">${name}</strong>
        <span>@${member.username || name}</span>
      </span>
    </div>
    <span class="roster-rank-badge rank-${member.rank_slug}">${member.rank_name}</span>
    <span class="roster-class-cell" style="color:${color}">
      <strong>${member.class_name}</strong>
    </span>
    <span class="roster-joined-cell">${member.joined_at ? new Date(member.joined_at.replace(' ', 'T') + 'Z').toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }) : '—'}</span>
  </article>`;
}

async function loadRoster() {
  const mount = document.getElementById('dynamicRoster');
  if (!mount) return;
  try {
    const data = await fetch('/api/roster').then(r => r.json());
    if (!data.ok) throw new Error(data.error || 'Roster unavailable.');

    // Lowest sort_order is the highest guild rank. Keep this as the initial load order.
    const members = [...(data.members || [])].sort((a, b) =>
      Number(a.rank_sort_order) - Number(b.rank_sort_order) ||
      String(a.ingame_name || a.username || '').localeCompare(String(b.ingame_name || b.username || ''))
    );

    if (!members.length) {
      mount.innerHTML = '<div class="notice-card"><h2>Guild Roster</h2><p>No guild members have registered yet.</p></div>';
      return;
    }

    mount.innerHTML = `<div class="roster-table" role="table" aria-label="Guild roster">
      <div class="roster-table-header" role="row">
        <span>Member</span><span>Rank</span><span>Class</span><span>Joined</span>
      </div>
      <div class="roster-table-body">${members.map(rosterMemberRow).join('')}</div>
    </div>`;
  } catch (err) {
    mount.innerHTML = `<div class="notice-card"><h2>Live Roster</h2><p>${err.message}</p><p>After D1 is bound and the schema is run, registered guild members will show here automatically.</p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', loadRoster);
