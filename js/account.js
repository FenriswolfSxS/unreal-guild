const state = { classes: [], ranks: [] };

const $ = (sel) => document.querySelector(sel);

function setMessage(text, type = '') {
  const el = $('#accountMessage');
  if (!el) return;
  el.textContent = text || '';
  el.className = `form-message ${type}`.trim();
}

async function loadOptions() {
  const data = await sxsFetchJson('/api/options');
  state.classes = data.classes || [];
  state.ranks = data.ranks || [];

  const classSelect = $('#classSlug');
  classSelect.innerHTML = '<option value="">Select your class</option>' + state.classes.map(c =>
    `<option value="${c.slug}">${c.name}</option>`
  ).join('');

  const rankSelect = $('#rankSlug');
  rankSelect.innerHTML = state.ranks.map(r =>
    `<option value="${r.slug}" ${r.slug === 'member' ? 'selected' : ''}>${r.name}</option>`
  ).join('');
}

function syncForm() {
  const accountType = document.querySelector('input[name="accountType"]:checked')?.value || 'guild_member';
  const isGuild = accountType === 'guild_member';
  const rank = $('#rankSlug')?.value || 'member';
  const needsPassword = isGuild && ['leader', 'deputy', 'officer'].includes(rank);

  $('#guildFields').hidden = !isGuild;
  $('#verificationWrap').hidden = !needsPassword;
  $('#classSlug').required = isGuild;
  $('#rankSlug').required = isGuild;
  $('#verificationPassword').required = needsPassword;
}

async function register(event) {
  event.preventDefault();
  setMessage('Creating account...', 'info');
  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    await sxsFetchJson('/api/register', { method: 'POST', body: JSON.stringify(payload) });
    setMessage('Account created. Taking you to your profile...', 'success');
    setTimeout(() => location.href = 'profile.html', 600);
  } catch (err) {
    setMessage(err.message, 'error');
  }
}

async function login(event) {
  event.preventDefault();
  setMessage('Signing in...', 'info');
  const formData = new FormData(event.currentTarget);
  const payload = Object.fromEntries(formData.entries());
  try {
    await sxsFetchJson('/api/login', { method: 'POST', body: JSON.stringify(payload) });
    setMessage('Signed in. Taking you to your profile...', 'success');
    setTimeout(() => location.href = 'profile.html', 500);
  } catch (err) {
    setMessage(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try { await loadOptions(); } catch (err) { setMessage('Database setup needs the latest db/schema.sql. Details: ' + err.message, 'error'); }
  document.querySelectorAll('input[name="accountType"], #rankSlug').forEach(el => el.addEventListener('change', syncForm));
  $('#registerForm')?.addEventListener('submit', register);
  $('#loginForm')?.addEventListener('submit', login);
  syncForm();
});
