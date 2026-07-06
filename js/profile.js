const $ = (sel) => document.querySelector(sel);
let currentUser = null;
let options = { classes: [] };

function setProfileMessage(text, type = '') {
  const el = $('#profileMessage');
  if (!el) return;
  el.textContent = text || '';
  el.className = `form-message ${type}`.trim();
}

async function loadProfile() {
  const me = await sxsFetchJson('/api/me');
  if (!me.signedIn) {
    location.href = 'account.html';
    return;
  }
  currentUser = me.user;
  options = await sxsFetchJson('/api/options');

  $('#profileTitle').textContent = currentUser.ingame_name || currentUser.username;
  $('#profileMeta').innerHTML = currentUser.account_type === 'guild_member'
    ? `<strong ${sxsClassStyle(currentUser.class_color)}>${currentUser.class_name}</strong> • ${currentUser.rank_name}`
    : 'Community User';
  $('#ingameName').value = currentUser.ingame_name || '';

  const classSelect = $('#classSlug');
  if (currentUser.account_type === 'guild_member') {
    classSelect.innerHTML = '<option value="">Select your class</option>' + options.classes.map(c =>
      `<option value="${c.slug}" ${c.slug === currentUser.class_slug ? 'selected' : ''}>${c.name}</option>`
    ).join('');
    $('#guildProfileFields').hidden = false;
  } else {
    $('#guildProfileFields').hidden = true;
  }
}

async function saveProfile(event) {
  event.preventDefault();
  setProfileMessage('Saving...', 'info');
  const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
  try {
    await sxsFetchJson('/api/profile', { method: 'POST', body: JSON.stringify(payload) });
    setProfileMessage('Profile updated. The roster will update automatically.', 'success');
    await loadProfile();
  } catch (err) {
    setProfileMessage(err.message, 'error');
  }
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  location.href = 'account.html';
}

document.addEventListener('DOMContentLoaded', async () => {
  try { await loadProfile(); } catch (err) { setProfileMessage(err.message, 'error'); }
  $('#profileForm')?.addEventListener('submit', saveProfile);
  $('#logoutButton')?.addEventListener('click', logout);
});
