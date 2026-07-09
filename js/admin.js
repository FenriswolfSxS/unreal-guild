const adminState = { me: null, bubbles: [], currentPageKey: 'guides', media: [], focusBubble: null };
const params = new URLSearchParams(location.search);
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
  qs('#mediaPanel').hidden = !can('admin_dashboard');
}

async function loadBubbles() {
  if (!can('edit_home')) return;
  adminState.focusBubble = params.get('bubble');
  const data = await adminFetchJson('/api/content/home-bubbles');
  adminState.bubbles = data.bubbles || [];
  const wrap = qs('#bubbleEditor');
  wrap.innerHTML = adminState.bubbles.map(b => `
    <div class="admin-edit-box" data-id="${b.id}">
      <h3>Bubble ${b.id}: ${escapeHtml(b.title || 'Untitled')}</h3>
      <label>Title<input name="title" value="${escapeAttr(b.title || '')}"></label>
      <label>Text<textarea name="body" rows="4">${escapeHtml(b.body || '')}</textarea></label>
      <label>Button Label<input name="button_label" value="${escapeAttr(b.button_label || '')}" placeholder="Optional"></label>
      <label>Button Link<input name="button_link" value="${escapeAttr(b.button_link || '')}" placeholder="Optional"></label>
    </div>
  `).join('');
  if (adminState.focusBubble) {
    const box = wrap.querySelector(`[data-id="${CSS.escape(adminState.focusBubble)}"]`);
    if (box) { box.scrollIntoView({ behavior: 'smooth', block: 'center' }); box.querySelector('input, textarea')?.focus(); }
  }
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
  const pageKey = params.get('page') || qs('#pageKey').value;
  if (qs('#pageKey').value !== pageKey) qs('#pageKey').value = pageKey;
  adminState.currentPageKey = pageKey;
  try {
    const data = await adminFetchJson('/api/content/page?page_key=' + encodeURIComponent(pageKey));
    qs('#pageTitle').value = data.page.title || '';
    qs('#pageContent').value = data.page.content_html || '';
    if (params.get('page')) qs('#guidePanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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


async function loadMedia() {
  if (!can('admin_dashboard')) return;
  const data = await adminFetchJson('/api/media/list');
  adminState.media = data.assets || [];
  renderMedia();
}

function renderMedia() {
  const wrap = qs('#mediaLibrary');
  if (!wrap) return;
  if (!adminState.media.length) {
    wrap.innerHTML = '<p class="muted">No media uploaded yet.</p>';
    return;
  }
  wrap.innerHTML = adminState.media.map(asset => `
    <div class="media-card" data-id="${escapeAttr(asset.id)}">
      <img src="${escapeAttr(asset.url)}" alt="${escapeAttr(asset.filename)}" loading="lazy">
      <div class="media-card-body">
        <strong>${escapeHtml(asset.filename)}</strong>
        <small>${escapeHtml(asset.uploaded_by_name || 'Leadership')} • ${escapeHtml(asset.created_at || '')}</small>
        <input readonly value="${escapeAttr(asset.url)}" aria-label="Media URL">
        <div class="media-actions">
          <button type="button" class="admin-button small" data-copy="${escapeAttr(asset.url)}">Copy URL</button>
          <button type="button" class="admin-button small danger" data-delete="${escapeAttr(asset.id)}">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function uploadMedia(event) {
  event.preventDefault();
  const fileInput = qs('#mediaFile');
  if (!fileInput?.files?.length) throw new Error('Choose an image first.');
  const form = new FormData();
  form.append('file', fileInput.files[0]);
  const res = await fetch('/api/media/upload', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || 'Upload failed.');
  fileInput.value = '';
  setAdminMessage('Image uploaded to R2.', 'success');
  await loadMedia();
}

async function deleteMedia(id) {
  if (!confirm('Delete this media item?')) return;
  await adminFetchJson('/api/media/delete', { method: 'POST', body: JSON.stringify({ id }) });
  setAdminMessage('Media item deleted.', 'success');
  await loadMedia();
}

function handleMediaClick(event) {
  const copy = event.target.closest('[data-copy]');
  if (copy) {
    navigator.clipboard?.writeText(copy.dataset.copy);
    setAdminMessage('Media URL copied.', 'success');
    return;
  }
  const del = event.target.closest('[data-delete]');
  if (del) deleteMedia(del.dataset.delete).catch(err => setAdminMessage(err.message, 'error'));
}

function escapeHtml(value) { return String(value).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function escapeAttr(value) { return escapeHtml(value).replace(/'/g, '&#39;'); }

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadMe();
    await loadBubbles();
    await loadPage();
    await loadMedia();
  } catch (err) {
    setAdminMessage(err.message, 'error');
  }
  qs('#saveBubbles')?.addEventListener('click', () => saveBubbles().catch(err => setAdminMessage(err.message, 'error')));
  qs('#pageKey')?.addEventListener('change', () => { params.delete('page'); loadPage().catch(err => setAdminMessage(err.message, 'error')); });
  qs('#savePage')?.addEventListener('click', () => savePage().catch(err => setAdminMessage(err.message, 'error')));
  qs('#mediaUploadForm')?.addEventListener('submit', (event) => uploadMedia(event).catch(err => setAdminMessage(err.message, 'error')));
  qs('#mediaLibrary')?.addEventListener('click', handleMediaClick);
});
