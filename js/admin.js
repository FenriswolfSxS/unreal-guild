const adminState = { me: null, members: [], ranks: [], classes: [], query: '' };
const qs = (s) => document.querySelector(s);
async function adminFetchJson(url, options = {}) {
  const res = await fetch(url, { headers: { 'content-type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || 'Something went wrong.');
  return data;
}
function setAdminMessage(text, type = '') { const el = qs('#adminMessage'); if (!el) return; el.textContent = text || ''; el.className = `form-message ${type}`.trim(); }
function can(permission) { const p = adminState.me?.permissions || []; return p.includes(permission) || p.includes('admin_dashboard') || p.includes('change_ranks'); }
async function loadMe() {
  const data = await adminFetchJson('/api/me');
  if (!data.signedIn) { location.href = 'account.html'; return; }
  adminState.me = data;
  if (!can('manage_members')) { qs('#adminRoot').innerHTML = '<section class="content-card"><h1>Admin</h1><p>You do not have permission to manage members.</p></section>'; return; }
  qs('#adminName').textContent = data.user?.ingame_name || data.user?.username || 'Admin';
  qs('#adminRank').textContent = data.user?.rank_name || 'Leadership';
}
async function loadMembers() {
  const data = await adminFetchJson('/api/members/list');
  adminState.members = data.members || []; adminState.ranks = data.ranks || []; adminState.classes = data.classes || [];
  renderMembers();
}
function renderMembers() {
  const wrap = qs('#memberManager'); if (!wrap) return;
  const q = adminState.query.toLowerCase();
  const rows = adminState.members.filter(m => !q || [m.ingame_name,m.username,m.email,m.rank_name,m.class_name,m.status,m.account_type].some(v => String(v||'').toLowerCase().includes(q)));
  if (!rows.length) { wrap.innerHTML = '<p class="muted">No members found.</p>'; return; }
  wrap.innerHTML = rows.map(m => memberCard(m)).join('');
}
function memberCard(m) {
  const rankOptions = adminState.ranks.map(r => `<option value="${r.id}" ${Number(m.rank_id)===Number(r.id)?'selected':''}>${escapeHtml(r.name)}</option>`).join('');
  const classOptions = adminState.classes.map(c => `<option value="${c.id}" ${Number(m.class_id)===Number(c.id)?'selected':''}>${escapeHtml(c.name)}</option>`).join('');
  const community = m.account_type === 'user';
  return `<div class="member-admin-card ${m.status==='suspended'?'is-suspended':''}" data-user-id="${escapeAttr(m.id)}">
    <div class="member-admin-head"><div><h3>${escapeHtml(m.ingame_name || m.username)}</h3><p>${escapeHtml(m.email || '')}</p></div><span class="status-pill">${escapeHtml(m.status || 'active')}</span></div>
    <div class="member-admin-grid">
      <label>Account Type<select name="account_type"><option value="guild_member" ${!community?'selected':''}>Guild Member</option><option value="user" ${community?'selected':''}>Community User</option></select></label>
      <label>Status<select name="status"><option value="active" ${m.status==='active'?'selected':''}>Active</option><option value="suspended" ${m.status==='suspended'?'selected':''}>Suspended / Remove Access</option></select></label>
      <label>Rank<select name="rank_id" ${community?'disabled':''}>${rankOptions}</select></label>
      <label>Class<select name="class_id" ${community?'disabled':''}>${classOptions}</select></label>
    </div>
    <div class="member-admin-actions"><button class="admin-button small" data-save-member>Save Member</button>${m.status==='active'?'<button class="admin-button small danger" data-suspend-member>Remove Access</button>':'<button class="admin-button small" data-reactivate-member>Reactivate</button>'}</div>
  </div>`;
}
async function saveMember(card, override = {}) {
  const body = {
    user_id: card.dataset.userId,
    account_type: card.querySelector('[name="account_type"]').value,
    status: card.querySelector('[name="status"]').value,
    rank_id: card.querySelector('[name="rank_id"]').value,
    class_id: card.querySelector('[name="class_id"]').value,
    ...override
  };
  await adminFetchJson('/api/members/update', { method:'POST', body: JSON.stringify(body) });
  setAdminMessage('Member updated.', 'success');
  await loadMembers();
}
function handleClick(event) {
  const card = event.target.closest('.member-admin-card'); if (!card) return;
  if (event.target.closest('[data-save-member]')) saveMember(card).catch(err => setAdminMessage(err.message, 'error'));
  if (event.target.closest('[data-suspend-member]')) { if (confirm('Remove this member\'s access? They will be signed out and hidden from active roster.')) saveMember(card, { status:'suspended' }).catch(err => setAdminMessage(err.message, 'error')); }
  if (event.target.closest('[data-reactivate-member]')) saveMember(card, { status:'active' }).catch(err => setAdminMessage(err.message, 'error'));
}
function handleChange(event) {
  const card = event.target.closest('.member-admin-card'); if (!card) return;
  if (event.target.name === 'account_type') {
    const off = event.target.value === 'user';
    card.querySelector('[name="rank_id"]').disabled = off;
    card.querySelector('[name="class_id"]').disabled = off;
  }
}
function escapeHtml(value) { return String(value).replace(/[&<>\"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }
function escapeAttr(value) { return escapeHtml(value).replace(/'/g, '&#39;'); }
document.addEventListener('DOMContentLoaded', async () => {
  try { await loadMe(); await loadMembers(); } catch (err) { setAdminMessage(err.message, 'error'); }
  qs('#memberManager')?.addEventListener('click', handleClick);
  qs('#memberManager')?.addEventListener('change', handleChange);
  qs('#refreshMembers')?.addEventListener('click', () => loadMembers().catch(err => setAdminMessage(err.message, 'error')));
  qs('#memberSearch')?.addEventListener('input', (e) => { adminState.query = e.target.value; renderMembers(); });
});
