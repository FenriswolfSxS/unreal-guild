async function sxsFetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || 'Something went wrong.');
  return data;
}

function sxsInstallAccountStyles() {
  if (document.getElementById('sxs-account-chip-styles')) return;
  const style = document.createElement('style');
  style.id = 'sxs-account-chip-styles';
  style.textContent = `
    .site-nav .account-profile-chip,.forge-nav .account-profile-chip{display:inline-flex!important;align-items:center!important;gap:8px!important;width:auto!important;max-width:230px!important;min-height:42px!important;padding:4px 8px!important;border-radius:999px!important;overflow:hidden!important;vertical-align:middle!important}
    .site-nav .account-profile-avatar,.forge-nav .account-profile-avatar{display:block!important;width:34px!important;height:34px!important;min-width:34px!important;max-width:34px!important;aspect-ratio:1/1!important;object-fit:cover!important;object-position:center!important;border-radius:50%!important;flex:0 0 34px!important}
    .site-nav .account-profile-placeholder,.forge-nav .account-profile-placeholder{display:grid!important;place-items:center!important;width:34px!important;height:34px!important;min-width:34px!important;max-width:34px!important;border-radius:50%!important;flex:0 0 34px!important}
    .site-nav .account-profile-copy,.forge-nav .account-profile-copy{display:grid!important;min-width:0!important;line-height:1.08!important;text-align:left!important}
    .site-nav .account-profile-copy strong,.forge-nav .account-profile-copy strong{display:block!important;max-width:145px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
    .site-nav .account-profile-copy small,.forge-nav .account-profile-copy small{display:block!important;white-space:nowrap!important}
  `;
  document.head.appendChild(style);
}

function sxsClassStyle(color) {
  return color ? `style="color:${color}; text-shadow:0 0 16px ${color}55"` : '';
}

function sxsFindNavs() {
  return Array.from(document.querySelectorAll('.site-nav, .forge-nav'));
}

async function sxsUpdateAccountNav() {
  const navs = sxsFindNavs();
  if (!navs.length) return;

  let data = { signedIn: false };
  try {
    data = await fetch('/api/me').then(r => r.json());
  } catch {
    data = { signedIn: false };
  }

  navs.forEach(async (nav) => {
    if (nav.dataset.authReady) return;
    nav.dataset.authReady = '1';

    const existing = nav.querySelector('.account-nav-link');
    if (existing) existing.remove();

    const link = document.createElement('a');
    link.className = 'account-nav-link';

    if (data.signedIn) {
      link.href = 'profile.html';
      link.classList.add('account-profile-chip');
      const name = data.user?.ingame_name || data.user?.username || 'Profile';
      let photoUrl = '';
      try {
        const profile = await fetch('/api/profile').then(r => r.ok ? r.json() : ({}));
        photoUrl = profile.character_image_url || '';
      } catch {}
      const avatar = photoUrl
        ? `<img class="account-profile-avatar" src="${photoUrl}" alt="" width="34" height="34" style="display:block;width:34px!important;height:34px!important;min-width:34px!important;max-width:34px!important;aspect-ratio:1/1;object-fit:cover!important;object-position:center!important;border-radius:50%!important;flex:0 0 34px!important" />`
        : `<span class="account-profile-placeholder">${name.slice(0,1).toUpperCase()}</span>`;
      const subtitle = data.user?.account_type === 'guild_member'
        ? `${data.user?.class_name || 'Guild Member'}${data.user?.rank_name ? ` • ${data.user.rank_name}` : ''}`
        : 'Community User';
      link.innerHTML = `${avatar}<span class="account-profile-copy"><strong ${sxsClassStyle(data.user?.class_color)}>${name}</strong><small>${subtitle}</small></span>`;
      link.title = 'Open profile';
      if ((data.permissions || []).includes('admin_dashboard') && !nav.querySelector('.admin-nav-link, a[href="admin.html"], a[href$="/admin.html"]')) {
        const admin = document.createElement('a');
        admin.className = 'admin-nav-link';
        admin.href = 'admin.html';
        admin.textContent = 'Admin';
        if (location.pathname.endsWith('/admin.html') || location.pathname === '/admin.html') admin.classList.add('active');
        const discord = nav.querySelector('.discord-link, .discord-pill');
        nav.insertBefore(admin, discord || null);
      }
    } else {
      link.href = 'account.html';
      link.textContent = 'Sign In';
    }

    const discord = nav.querySelector('.discord-link, .discord-pill');
    nav.insertBefore(link, discord || null);
  });
}

document.addEventListener('DOMContentLoaded', () => { sxsInstallAccountStyles(); sxsUpdateAccountNav(); });
