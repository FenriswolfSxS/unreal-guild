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
    .header-user-area .account-profile-chip{display:inline-flex!important;align-items:center!important;gap:10px!important;width:auto!important;max-width:230px!important;min-height:46px!important;overflow:hidden!important;vertical-align:middle!important}
    .header-user-area .account-profile-avatar{display:block!important;width:40px!important;height:40px!important;min-width:40px!important;max-width:40px!important;aspect-ratio:1/1!important;object-fit:cover!important;object-position:center!important;border-radius:50%!important;flex:0 0 40px!important}
    .header-user-area .account-profile-placeholder{display:grid!important;place-items:center!important;width:40px!important;height:40px!important;min-width:40px!important;max-width:40px!important;border-radius:50%!important;flex:0 0 40px!important}
    .header-user-area .account-profile-copy{display:grid!important;min-width:0!important;line-height:1.08!important}
    .header-user-area .account-profile-copy strong{display:block!important;max-width:145px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
    .header-user-area .account-profile-copy small{display:block!important;white-space:nowrap!important}
  `;
  document.head.appendChild(style);
}

function sxsClassStyle(color) {
  return color ? `style="color:${color}; text-shadow:0 0 16px ${color}55"` : '';
}

function sxsFindNavs() {
  return Array.from(document.querySelectorAll('.site-nav, .forge-nav'));
}

function sxsSetActiveNav(nav) {
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const buildPages = new Set(['builds.html','class-builds.html','community-builds.html','conqueror-builds.html','guardian-builds.html','destroyer-builds.html','dominator-builds.html']);
  const guidePages = new Set(['guides.html','food-guide.html','farming-guide.html','fantamon-guide.html','stat-guide.html']);
  const forumPages = new Set(['recruitment.html']);

  nav.querySelectorAll(':scope > a, :scope > .nav-group > a').forEach(a => a.classList.remove('active'));
  let target = page;
  if (buildPages.has(page)) target = 'builds.html';
  else if (guidePages.has(page)) target = 'guides.html';
  else if (forumPages.has(page)) target = 'recruitment.html';

  const links = Array.from(nav.querySelectorAll(':scope > a, :scope > .nav-group > a'));
  const match = links.find(a => (a.getAttribute('href') || '').split('/').pop().toLowerCase() === target);
  if (match) match.classList.add('active');
}

function sxsGetHeaderForNav(nav) {
  return nav.closest('.site-header, .forge-topbar') || nav.parentElement;
}

function sxsGetUserArea(nav) {
  const header = sxsGetHeaderForNav(nav);
  let area = header.querySelector(':scope > .header-user-area');
  if (!area) {
    area = document.createElement('div');
    area.className = 'header-user-area';
    area.setAttribute('aria-label', 'Account');
    header.appendChild(area);
  }
  return area;
}

async function sxsUpdateAccountNav() {
  const navs = sxsFindNavs();
  if (!navs.length) return;

  let data = { signedIn: false };
  try { data = await fetch('/api/me').then(r => r.json()); }
  catch { data = { signedIn: false }; }

  let photoUrl = '';
  if (data.signedIn) {
    try {
      const profile = await fetch('/api/profile').then(r => r.ok ? r.json() : ({}));
      photoUrl = profile.character_image_url || '';
    } catch {}
  }

  navs.forEach((nav) => {
    sxsSetActiveNav(nav);
    const area = sxsGetUserArea(nav);
    area.replaceChildren();

    const link = document.createElement('a');
    link.className = 'account-nav-link';

    if (data.signedIn) {
      link.href = 'profile.html';
      link.classList.add('account-profile-chip');
      const name = data.user?.ingame_name || data.user?.username || 'Profile';
      const avatar = photoUrl
        ? `<img class="account-profile-avatar" src="${photoUrl}" alt="" width="40" height="40" />`
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
        nav.appendChild(admin);
      }
    } else {
      link.href = 'account.html';
      link.textContent = 'Sign In';
    }

    area.appendChild(link);
    sxsSetActiveNav(nav);
    nav.dataset.authReady = '1';
  });
}

document.addEventListener('DOMContentLoaded', () => { sxsInstallAccountStyles(); sxsUpdateAccountNav(); });
