const ROSTER_CLASS_THEMES = Object.freeze({
  conqueror: { name: 'Conqueror', color: '#ff6b5d', icon: 'assets/class-icons/conqueror.png' },
  guardian:  { name: 'Guardian',  color: '#ffd166', icon: 'assets/class-icons/guardian.png' },
  destroyer: { name: 'Destroyer', color: '#73b7ff', icon: 'assets/class-icons/destroyer.png' },
  dominator: { name: 'Dominator', color: '#69ffe1', icon: 'assets/class-icons/dominator.png' }
});

function rosterEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function rosterInitial(member) {
  return (member.ingame_name || member.username || '?').slice(0, 1).toUpperCase();
}

function rosterClassTheme(member) {
  const raw = String(member.class_slug || member.class_name || '').trim().toLowerCase();
  const key = raw.replace(/[^a-z]/g, '');
  return ROSTER_CLASS_THEMES[key] || {
    name: member.class_name || 'Unassigned',
    color: '#8eefff',
    icon: 'assets/unreal-emblem.png'
  };
}

function rosterMemberRow(member) {
  const theme = rosterClassTheme(member);
  const color = theme.color;
  const name = member.ingame_name || member.username || 'Unknown Member';
  const username = member.username || name;
  const safeName = rosterEscape(name);
  const safeUsername = rosterEscape(username);
  const safeRank = rosterEscape(member.rank_name || 'Member');
  const safeRankSlug = rosterEscape(member.rank_slug || 'member');
  const safeClass = rosterEscape(theme.name);
  const safeIcon = rosterEscape(theme.icon);
  const image = member.character_image_url
    ? `<img class="roster-avatar-image" src="${rosterEscape(member.character_image_url)}" alt="${safeName} character" loading="lazy" />`
    : `<span class="member-avatar roster-avatar-placeholder" aria-hidden="true">${rosterEscape(rosterInitial(member))}</span>`;

  return `<article class="roster-member-row" role="row" style="--member-class-color:${color}">
    <div class="roster-member-identity" role="cell">
      ${image}
      <span class="roster-member-name-wrap">
        <strong>${safeName}</strong>
        <span>@${safeUsername}</span>
      </span>
    </div>
    <span class="roster-rank-badge rank-${safeRankSlug}" role="cell">${safeRank}</span>
    <span class="roster-class-cell" role="cell">
      <img src="${safeIcon}" alt="" aria-hidden="true" />
      <strong>${safeClass}</strong>
    </span>
    <span class="roster-emblem-cell" role="cell" aria-label="${safeClass} emblem">
      <img src="${safeIcon}" alt="${safeClass} emblem" loading="lazy" />
    </span>
  </article>`;
}

async function loadRoster() {
  const mount = document.getElementById('dynamicRoster');
  if (!mount) return;
  try {
    const response = await fetch('/api/roster', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Roster unavailable.');

    // Lowest sort_order is the highest guild rank. Keep this as the initial load order.
    const members = [...(data.members || [])].sort((a, b) =>
      Number(a.rank_sort_order ?? 999) - Number(b.rank_sort_order ?? 999) ||
      String(a.ingame_name || a.username || '').localeCompare(String(b.ingame_name || b.username || ''))
    );

    if (!members.length) {
      mount.innerHTML = '<div class="notice-card"><h2>Guild Roster</h2><p>No guild members have registered yet.</p></div>';
      return;
    }

    mount.innerHTML = `<div class="roster-table" role="table" aria-label="Guild roster">
      <div class="roster-table-header" role="row">
        <span role="columnheader">Member</span><span role="columnheader">Rank</span><span role="columnheader">Class</span><span role="columnheader">Emblem</span>
      </div>
      <div class="roster-table-body">${members.map(rosterMemberRow).join('')}</div>
    </div>`;
  } catch (err) {
    mount.innerHTML = `<div class="notice-card"><h2>Live Roster</h2><p>${rosterEscape(err.message)}</p><p>After D1 is bound and the schema is run, registered guild members will show here automatically.</p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', loadRoster);
