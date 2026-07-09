(function () {
  let editPermissions = [];
  let me = null;
  let activeUploadImage = null;

  async function fetchJson(url, options) {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) throw new Error(data.error || 'Request failed');
    return data;
  }

  async function loadMeForEditing() {
    try {
      const data = await fetchJson('/api/me');
      me = data;
      editPermissions = data.permissions || [];
      if (data.signedIn && (canEdit('edit_home') || canEdit('edit_guides'))) {
        document.body.classList.add('leadership-edit-available');
        addEditToggle();
      }
    } catch (_) {}
  }

  function canEdit(slug) {
    return editPermissions.includes(slug) || editPermissions.includes('admin_dashboard') || editPermissions.includes('manage_site_settings');
  }

  function addEditToggle() {
    if (document.querySelector('#leadershipEditToggle')) return;
    const btn = document.createElement('button');
    btn.id = 'leadershipEditToggle';
    btn.type = 'button';
    btn.textContent = 'Edit: Off';
    btn.className = 'edit-toggle-button';
    btn.addEventListener('click', () => {
      const on = !document.body.classList.contains('leadership-edit-on');
      document.body.classList.toggle('leadership-edit-on', on);
      btn.textContent = on ? 'Edit: On' : 'Edit: Off';
      setInlineEditing(on);
    });
    document.body.appendChild(btn);
  }

  async function loadHomeBubbles() {
    const grid = document.querySelector('[data-home-bubbles]');
    if (!grid) return;
    try {
      const data = await fetchJson('/api/content/home-bubbles');
      const bubbles = data.bubbles || [];
      if (!bubbles.length) return;
      grid.innerHTML = bubbles.map(b => `
        <article class="notice-card editable-bubble" data-bubble-id="${b.id}">
          <span class="edit-chip">Click to edit</span>
          <h2>${escapeHtml(b.title || '')}</h2>
          <p>${escapeHtml(b.body || '')}</p>
          ${b.button_label && b.button_link ? `<a href="${escapeAttr(b.button_link)}">${escapeHtml(b.button_label)} →</a>` : ''}
        </article>
      `).join('');
      grid.addEventListener('click', (event) => {
        const card = event.target.closest('.editable-bubble');
        if (!card || !document.body.classList.contains('leadership-edit-on')) return;
        event.preventDefault();
        location.href = 'admin.html?bubble=' + encodeURIComponent(card.dataset.bubbleId);
      });
    } catch (_) {}
  }

  function pageKeyFromPath() {
    const file = location.pathname.split('/').pop() || 'index.html';
    if (file === 'food-guide.html') return 'food-guide';
    if (file === 'guides.html') return 'guides';
    return (document.querySelector('[data-inline-guide-page]') || document.querySelector('[data-editable-page]'))?.dataset.inlineGuidePage || document.querySelector('[data-editable-page]')?.dataset.editablePage || '';
  }

  function editableRoot() {
    return document.querySelector('[data-inline-guide-page]') || document.querySelector('[data-editable-page]');
  }

  async function loadEditablePage() {
    const target = editableRoot();
    if (!target) return;
    const pageKey = target.dataset.inlineGuidePage || target.dataset.editablePage || pageKeyFromPath();
    try {
      const data = await fetchJson('/api/content/page?page_key=' + encodeURIComponent(pageKey));
      const html = data.page?.content_html || '';
      // Do NOT let old database placeholders wipe out newer built-in starter content.
      // Member-edited content still wins once it has real page HTML saved in D1.
      if (html && !isLegacyPlaceholder(pageKey, html)) target.innerHTML = html;
    } catch (_) {}
  }

  function isLegacyPlaceholder(pageKey, html) {
    const normalized = String(html || '').trim().replace(/\s+/g, ' ');
    const placeholders = new Set([
      '<p>Guild knowledge, guides, and strategy pages.</p>',
      '<p>Phee\'s full Sword X Staff food system guide with recipes and screenshots.</p>',
      '<p>Phee&#39;s full Sword X Staff food system guide with recipes and screenshots.</p>',
      '<p>Routes, resources, farming tips, and material locations.</p>',
      '<p>Fantamon info, recommendations, and upgrade tips.</p>',
      '<p>Stat priorities, explanations, and class-specific stat notes.</p>'
    ]);
    if (placeholders.has(normalized)) return true;
    if (pageKey && !normalized) return true;
    return false;
  }

  function addInlineToolbar() {
    if (document.querySelector('#inlineEditToolbar')) return;
    const bar = document.createElement('div');
    bar.id = 'inlineEditToolbar';
    bar.className = 'inline-edit-toolbar';
    bar.innerHTML = `
      <button type="button" data-inline-action="save">Save Changes</button>
      <button type="button" data-inline-action="heading">+ Heading</button>
      <button type="button" data-inline-action="text">+ Text</button>
      <button type="button" data-inline-action="image">+ Image</button>
      <span class="inline-edit-hint">Click directly into the guide to edit text. Click an image to replace it.</span>
      <input id="inlineImageUpload" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
    `;
    document.body.appendChild(bar);
    bar.addEventListener('click', handleToolbarClick);
    bar.querySelector('#inlineImageUpload').addEventListener('change', uploadInlineImage);
  }

  function removeInlineToolbar() {
    document.querySelector('#inlineEditToolbar')?.remove();
  }

  function setInlineEditing(on) {
    const root = editableRoot();
    if (canEdit('edit_guides') && root) {
      root.contentEditable = on ? 'true' : 'false';
      root.classList.toggle('inline-edit-root', on);
      root.dataset.pageKey = root.dataset.inlineGuidePage || root.dataset.editablePage || pageKeyFromPath();
      if (on) addInlineToolbar(); else removeInlineToolbar();
    }
  }

  async function handleToolbarClick(event) {
    const btn = event.target.closest('[data-inline-action]');
    if (!btn) return;
    const action = btn.dataset.inlineAction;
    const root = editableRoot();
    if (!root) return;
    if (action === 'save') return saveInlinePage();
    if (action === 'heading') return insertHtmlAtCursor('<h3>New Section</h3><p>Write the section text here.</p>');
    if (action === 'text') return insertHtmlAtCursor('<p>Write new text here.</p>');
    if (action === 'image') {
      activeUploadImage = null;
      document.querySelector('#inlineImageUpload')?.click();
    }
  }

  function insertHtmlAtCursor(html) {
    const root = editableRoot();
    root?.focus();
    try { document.execCommand('insertHTML', false, html); }
    catch (_) { root.insertAdjacentHTML('beforeend', html); }
  }

  async function saveInlinePage() {
    const root = editableRoot();
    if (!root) return;
    const pageKey = root.dataset.pageKey || root.dataset.inlineGuidePage || root.dataset.editablePage || pageKeyFromPath();
    const title = document.querySelector('h1')?.textContent?.trim() || pageKey;
    const clean = root.cloneNode(true);
    clean.querySelectorAll('.edit-chip,.inline-image-tools').forEach(el => el.remove());
    clean.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    await fetchJson('/api/content/page', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ page_key: pageKey, title, content_html: clean.innerHTML })
    });
    toast('Saved.');
  }

  document.addEventListener('click', (event) => {
    if (!document.body.classList.contains('leadership-edit-on')) return;
    const img = event.target.closest('[data-inline-guide-page] img, [data-editable-page] img');
    if (!img) return;
    event.preventDefault();
    event.stopPropagation();
    activeUploadImage = img;
    document.querySelector('#inlineImageUpload')?.click();
  }, true);

  async function uploadInlineImage(event) {
    const input = event.target;
    const file = input.files && input.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/media/upload', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || 'Upload failed.');
      const url = data.asset?.url;
      if (activeUploadImage) {
        activeUploadImage.src = url;
        activeUploadImage.alt = file.name.replace(/\.[^.]+$/, '');
      } else {
        insertHtmlAtCursor(`<figure><img src="${escapeAttr(url)}" alt="${escapeAttr(file.name.replace(/\.[^.]+$/, ''))}"><figcaption>Caption</figcaption></figure>`);
      }
      toast('Image uploaded. Click Save Changes to keep it on the page.');
    } catch (err) { alert(err.message); }
    finally { input.value = ''; activeUploadImage = null; }
  }

  function toast(text) {
    let el = document.querySelector('#inlineEditToast');
    if (!el) { el = document.createElement('div'); el.id = 'inlineEditToast'; el.className = 'inline-edit-toast'; document.body.appendChild(el); }
    el.textContent = text;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2200);
  }

  function escapeHtml(value) { return String(value).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function escapeAttr(value) { return escapeHtml(value).replace(/'/g, '&#39;'); }

  document.addEventListener('DOMContentLoaded', async () => {
    await loadMeForEditing();
    await loadHomeBubbles();
    await loadEditablePage();
  });
})();
