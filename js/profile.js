const $ = (sel) => document.querySelector(sel);
let currentUser = null;
let options = { classes: [] };

function setProfileMessage(text, type = '') {
  const el = $('#profileMessage');
  if (!el) return;
  el.textContent = text || '';
  el.className = `form-message ${type}`.trim();
}

function showCharacterPhoto(url) {
  const preview = $('#characterPhotoPreview');
  const placeholder = $('#characterPhotoPlaceholder');
  const hidden = $('#characterImageUrl');
  if (hidden) hidden.value = url || '';
  if (url) {
    preview.src = url;
    preview.hidden = false;
    placeholder.hidden = true;
  } else {
    preview.removeAttribute('src');
    preview.hidden = true;
    placeholder.hidden = false;
  }
}

async function loadProfile() {
  const me = await sxsFetchJson('/api/me');
  if (!me.signedIn) {
    location.href = 'account.html';
    return;
  }
  currentUser = me.user;
  options = await sxsFetchJson('/api/options');
  const profileData = await sxsFetchJson('/api/profile');

  $('#profileTitle').textContent = currentUser.ingame_name || currentUser.username;
  $('#profileMeta').innerHTML = currentUser.account_type === 'guild_member'
    ? `<strong ${sxsClassStyle(currentUser.class_color)}>${currentUser.class_name}</strong> • ${currentUser.rank_name}`
    : 'Community User';
  $('#ingameName').value = currentUser.ingame_name || '';
  showCharacterPhoto(profileData.character_image_url || '');

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

async function uploadCharacterPhoto() {
  const input = $('#characterPhotoFile');
  const file = input?.files?.[0];
  if (!file) {
    setProfileMessage('Choose a character image first.', 'error');
    return;
  }
  setProfileMessage('Uploading character photo...', 'info');
  const form = new FormData();
  form.append('file', file);
  try {
    const response = await fetch('/api/media/upload', { method: 'POST', body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || 'Photo upload failed.');
    showCharacterPhoto(data.asset.url);
    setProfileMessage('Photo uploaded. Click Save Profile to publish it to the roster.', 'success');
  } catch (err) {
    setProfileMessage(err.message, 'error');
  }
}

function removeCharacterPhoto() {
  showCharacterPhoto('');
  const input = $('#characterPhotoFile');
  if (input) input.value = '';
  setProfileMessage('Photo removed from the profile form. Click Save Profile to confirm.', 'info');
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
  $('#uploadCharacterPhoto')?.addEventListener('click', uploadCharacterPhoto);
  $('#removeCharacterPhoto')?.addEventListener('click', removeCharacterPhoto);
  $('#logoutButton')?.addEventListener('click', logout);
});
