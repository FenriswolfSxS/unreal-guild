async function sxsFetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || 'Something went wrong.');
  return data;
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

  navs.forEach((nav) => {
    if (nav.dataset.authReady) return;
    nav.dataset.authReady = '1';

    const existing = nav.querySelector('.account-nav-link');
    if (existing) existing.remove();

    const link = document.createElement('a');
    link.className = 'account-nav-link';

    if (data.signedIn) {
      link.href = 'profile.html';
      const name = data.user?.ingame_name || data.user?.username || 'Profile';
      link.innerHTML = `<span ${sxsClassStyle(data.user?.class_color)}>${name}</span>`;
      link.title = 'Profile';
    } else {
      link.href = 'account.html';
      link.textContent = 'Sign In';
    }

    const discord = nav.querySelector('.discord-link, .discord-pill');
    nav.insertBefore(link, discord || null);
  });
}

document.addEventListener('DOMContentLoaded', sxsUpdateAccountNav);
