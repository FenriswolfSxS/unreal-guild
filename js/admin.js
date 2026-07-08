const adminState = { me: null, bubbles: [], currentPageKey: 'guides' };
const qs = (s) => document.querySelector(s);

async function adminFetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || 'Something went wrong.');
  return data;
}

function setAdminMessage(text, type = '') {
  const el = qs('#adminMessage');
  if (!el) return;
  el.textContent = text || '';
  el.className = `form-message ${type}`.trim();
}

function can(permission) {
  return (adminState.me?.permissions || []).includes(permission);
}

async function loadMe() {
  const data = await adminFetchJson('/api/me');
  if (!data.signedIn) {
    location.href = 'account.html';
    return;
  }
  adminState.me = data;
  if (!can('admin_dashboard')) {
    qs('#adminRoot').innerHTML = '<section class="content-card"><h1>Admin</h1><p>You do not have permission to access the admin dashboard.</p></section>';
    return;
  }
  qs('#adminName').textContent = data.user?.ingame_name || data.user?.username || 'Admin';
  qs('#adminRank').textContent = data.user?.rank_name || 'Leadership';
  qs('#bubblePanel').hidden = !can('edit_home');
  qs('#guidePanel').hidden = !can('edit_guides');
}

async function loadBubbles() {
  if (!can('edit_home')) return;
  const data = await adminFetchJson('/api/content/home-bubbles');
  adminState.bubbles = data.bubbles || [];
  const wrap = qs('#bubbleEditor');
  wrap.innerHTML = adminState.bubbles.map(b => `
    <div class="admin-edit-box" data-id="${b.id}">
      <h3>Bubble ${b.id}</h3>
      <label>Title<input name="title" value="${escapeAttr(b.title || '')}"></label>
      <label>Text<textarea name="body" rows="4">${escapeHtml(b.body || '')}</textarea></label>
      <label>Button Label<input name="button_label" value="${escapeAttr(b.button_label || '')}" placeholder="Optional"></label>
      <label>Button Link<input name="button_link" value="${escapeAttr(b.button_link || '')}" placeholder="Optional"></label>
    </div>
  `).join('');
}

async function saveBubbles() {
  const bubbles = Array.from(document.querySelectorAll('.admin-edit-box')).map(box => ({
    id: Number(box.dataset.id),
    title: box.querySelector('[name="title"]').value,
    body: box.querySelector('[name="body"]').value,
    button_label: box.querySelector('[name="button_label"]').value,
    button_link: box.querySelector('[name="button_link"]').value,
  }));
  await adminFetchJson('/api/content/home-bubbles', { method: 'PUT', body: JSON.stringify({ bubbles }) });
  setAdminMessage('Homepage bubbles saved.', 'success');
}

async function loadPage() {
  if (!can('edit_guides')) return;
  const pageKey = qs('#pageKey').value;
  adminState.currentPageKey = pageKey;
  try {
    const data = await adminFetchJson('/api/content/page?page_key=' + encodeURIComponent(pageKey));
    qs('#pageTitle').value = data.page.title || '';
    qs('#pageContent').value = data.page.content_html || '';
  } catch (err) {
    qs('#pageTitle').value = pageKey;
    qs('#pageContent').value = '';
  }
}

async function savePage() {
  await adminFetchJson('/api/content/page', {
    method: 'PUT',
    body: JSON.stringify({
      page_key: qs('#pageKey').value,
      title: qs('#pageTitle').value,
      content_html: qs('#pageContent').value,
    }),
  });
  setAdminMessage('Guide content saved.', 'success');
}

function escapeHtml(value) { return String(value).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function escapeAttr(value) { return escapeHtml(value).replace(/'/g, '&#39;'); }

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadMe();
    await loadBubbles();
    await loadPage();
  } catch (err) {
    setAdminMessage(err.message, 'error');
  }
  qs('#saveBubbles')?.addEventListener('click', () => saveBubbles().catch(err => setAdminMessage(err.message, 'error')));
  qs('#pageKey')?.addEventListener('change', () => loadPage().catch(err => setAdminMessage(err.message, 'error')));
  qs('#savePage')?.addEventListener('click', () => savePage().catch(err => setAdminMessage(err.message, 'error')));
});
