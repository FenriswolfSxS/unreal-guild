(function () {
  let editPermissions = [];
  let me = null;
  let activeUploadImage = null;
  let homeBubbles = [];
  let dragState = null;

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
      setHomeEditing(on);
    });
    document.body.appendChild(btn);
  }

  async function loadHomeBubbles() {
    const grid = document.querySelector('[data-home-bubbles]');
    if (!grid) return;
    try {
      const data = await fetchJson('/api/content/home-bubbles');
      homeBubbles = data.bubbles || [];
      if (!homeBubbles.length) return;
      renderHomeBubbles(grid);
      renderQuickClicks();
    } catch (_) {}
  }

  function renderQuickClicks() {
    const wrap = document.querySelector('[data-home-quick-clicks]');
    if (!wrap) return;
    wrap.innerHTML = homeBubbles.map(b => `<button type="button" data-jump-bubble="${b.id}">${escapeHtml(b.quick_label || b.title || ('Bubble ' + b.id))}</button>`).join('');
    wrap.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-jump-bubble]');
      if (!btn) return;
      const card = document.querySelector(`[data-bubble-id="${CSS.escape(btn.dataset.jumpBubble)}"]`);
      card?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      card?.classList.add('bubble-pulse');
      setTimeout(() => card?.classList.remove('bubble-pulse'), 1100);
    }, { once:false });
  }

  function renderHomeBubbles(grid) {
    grid.innerHTML = homeBubbles.map((b, idx) => {
      const savedPlaced = Number(b.pos_x || 0) || Number(b.pos_y || 0);
      const defaultX = (idx % 4) * 280;
      const defaultY = Math.floor(idx / 4) * 220;
      const x = savedPlaced ? Number(b.pos_x || 0) : defaultX;
      const y = savedPlaced ? Number(b.pos_y || 0) : defaultY;
      const w = Number(b.width || 260), h = Number(b.height || 190);
      const placed = true;
      return `<article class="notice-card editable-bubble rune-bubble" data-bubble-id="${b.id}" style="${placed ? `left:${x}px;top:${y}px;width:${w}px;min-height:${h}px;` : ''}">
        <span class="edit-chip">Drag • Resize • Type</span>
        <span class="bubble-move-handle" title="Drag to move">✦</span>
        <h2 contenteditable="false">${escapeHtml(b.title || '')}</h2>
        <p contenteditable="false">${escapeHtml(b.body || '')}</p>
        ${b.button_label && b.button_link ? `<a class="bubble-link" href="${escapeAttr(b.button_link)}">${escapeHtml(b.button_label)} →</a>` : ''}
        <span class="bubble-resize-handle" title="Drag to resize"></span>
      </article>`;
    }).join('');
    grid.addEventListener('pointerdown', startBubblePointer, true);
    grid.addEventListener('input', updateBubbleFromDom, true);
  }

  function setHomeEditing(on) {
    if (!document.querySelector('[data-home-bubbles]')) return;
    document.querySelectorAll('.editable-bubble h2,.editable-bubble p').forEach(el => el.contentEditable = on ? 'true' : 'false');
    if (on) addHomeToolbar(); else removeHomeToolbar();
  }

  function addHomeToolbar() {
    if (!canEdit('edit_home')) return;
    if (document.querySelector('#homeEditToolbar')) return;
    const bar = document.createElement('div');
    bar.id = 'homeEditToolbar';
    bar.className = 'inline-edit-toolbar home-edit-toolbar';
    bar.innerHTML = `<button type="button" data-home-action="save">Save Home</button><span class="inline-edit-hint">Drag the ✦ to move. Drag the corner to resize. Click text to edit.</span>`;
    document.body.appendChild(bar);
    bar.addEventListener('click', (event) => {
      if (event.target.closest('[data-home-action="save"]')) saveHomeBubbles().catch(err => alert(err.message));
    });
  }
  function removeHomeToolbar() { document.querySelector('#homeEditToolbar')?.remove(); }

  function startBubblePointer(event) {
    if (!document.body.classList.contains('leadership-edit-on')) return;
    const card = event.target.closest('.editable-bubble');
    if (!card) return;
    const resize = event.target.closest('.bubble-resize-handle');
    const move = event.target.closest('.bubble-move-handle');
    if (!resize && !move) return;
    event.preventDefault();
    const stage = document.querySelector('[data-home-stage]');
    const cr = card.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    dragState = { card, mode: resize ? 'resize' : 'move', startX:event.clientX, startY:event.clientY, left: cr.left - sr.left + stage.scrollLeft, top: cr.top - sr.top + stage.scrollTop, width: cr.width, height: cr.height };
    card.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointermove', moveBubblePointer);
    window.addEventListener('pointerup', endBubblePointer, { once:true });
  }
  function moveBubblePointer(event) {
    if (!dragState) return;
    const dx = event.clientX - dragState.startX, dy = event.clientY - dragState.startY;
    if (dragState.mode === 'move') {
      dragState.card.style.left = Math.max(0, dragState.left + dx) + 'px';
      dragState.card.style.top = Math.max(0, dragState.top + dy) + 'px';
    } else {
      dragState.card.style.width = Math.max(180, dragState.width + dx) + 'px';
      dragState.card.style.minHeight = Math.max(140, dragState.height + dy) + 'px';
    }
    updateBubbleFromDom();
  }
  function endBubblePointer() {
    window.removeEventListener('pointermove', moveBubblePointer);
    dragState = null;
  }

  function updateBubbleFromDom() {
    document.querySelectorAll('.editable-bubble').forEach(card => {
      const b = homeBubbles.find(x => Number(x.id) === Number(card.dataset.bubbleId));
      if (!b) return;
      b.title = card.querySelector('h2')?.textContent?.trim() || 'Untitled';
      b.body = card.querySelector('p')?.textContent?.trim() || '';
      b.quick_label = b.title;
      b.pos_x = parseInt(card.style.left || '0', 10) || 0;
      b.pos_y = parseInt(card.style.top || '0', 10) || 0;
      b.width = Math.round(card.getBoundingClientRect().width) || 260;
      b.height = Math.round(card.getBoundingClientRect().height) || 190;
    });
    renderQuickClicks();
  }

  async function saveHomeBubbles() {
    updateBubbleFromDom();
    await fetchJson('/api/content/home-bubbles', {
      method: 'PUT', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bubbles: homeBubbles })
    });
    toast('Home saved.');
  }

  function pageKeyFromPath() {
    const file = location.pathname.split('/').pop() || 'index.html';
    if (file === 'food-guide.html') return 'food-guide';
    if (file === 'guides.html') return 'guides';
    return (document.querySelector('[data-inline-guide-page]') || document.querySelector('[data-editable-page]'))?.dataset.inlineGuidePage || document.querySelector('[data-editable-page]')?.dataset.editablePage || '';
  }
  function editableRoot() { return document.querySelector('[data-inline-guide-page]') || document.querySelector('[data-editable-page]'); }

  async function loadEditablePage() {
    const target = editableRoot();
    if (!target) return;
    const pageKey = target.dataset.inlineGuidePage || target.dataset.editablePage || pageKeyFromPath();
    try {
      const data = await fetchJson('/api/content/page?page_key=' + encodeURIComponent(pageKey));
      const html = data.page?.content_html || '';
      if (html && !isLegacyPlaceholder(pageKey, html)) target.innerHTML = html;
    } catch (_) {}
  }

  function isLegacyPlaceholder(pageKey, html) {
    const normalized = String(html || '').trim().replace(/\s+/g, ' ');
    const placeholders = new Set(['<p>Guild knowledge, guides, and strategy pages.</p>','<p>Phee\'s full Sword X Staff food system guide with recipes and screenshots.</p>','<p>Phee&#39;s full Sword X Staff food system guide with recipes and screenshots.</p>','<p>Routes, resources, farming tips, and material locations.</p>','<p>Fantamon info, recommendations, and upgrade tips.</p>','<p>Stat priorities, explanations, and class-specific stat notes.</p>']);
    return placeholders.has(normalized) || (pageKey && !normalized);
  }

  function addInlineToolbar() {
    if (document.querySelector('#inlineEditToolbar')) return;
    const bar = document.createElement('div');
    bar.id = 'inlineEditToolbar';
    bar.className = 'inline-edit-toolbar';
    bar.innerHTML = `<button type="button" data-inline-action="save">Save Changes</button><button type="button" data-inline-action="heading">+ Heading</button><button type="button" data-inline-action="text">+ Text</button><button type="button" data-inline-action="image">+ Image</button><span class="inline-edit-hint">Click directly into the guide to edit text. Click an image to replace it.</span><input id="inlineImageUpload" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>`;
    document.body.appendChild(bar);
    bar.addEventListener('click', handleToolbarClick);
    bar.querySelector('#inlineImageUpload').addEventListener('change', uploadInlineImage);
  }
  function removeInlineToolbar() { document.querySelector('#inlineEditToolbar')?.remove(); }

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
    if (action === 'image') { activeUploadImage = null; document.querySelector('#inlineImageUpload')?.click(); }
  }

  function insertHtmlAtCursor(html) { const root = editableRoot(); root?.focus(); try { document.execCommand('insertHTML', false, html); } catch (_) { root.insertAdjacentHTML('beforeend', html); } }

  async function saveInlinePage() {
    const root = editableRoot(); if (!root) return;
    const pageKey = root.dataset.pageKey || root.dataset.inlineGuidePage || root.dataset.editablePage || pageKeyFromPath();
    const title = document.querySelector('h1')?.textContent?.trim() || pageKey;
    const clean = root.cloneNode(true);
    clean.querySelectorAll('.edit-chip,.inline-image-tools').forEach(el => el.remove());
    clean.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    await fetchJson('/api/content/page', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ page_key: pageKey, title, content_html: clean.innerHTML }) });
    toast('Saved.');
  }

  document.addEventListener('click', (event) => {
    if (!document.body.classList.contains('leadership-edit-on')) return;
    const img = event.target.closest('[data-inline-guide-page] img, [data-editable-page] img');
    if (!img) return;
    event.preventDefault(); event.stopPropagation(); activeUploadImage = img; document.querySelector('#inlineImageUpload')?.click();
  }, true);

  async function uploadInlineImage(event) {
    const input = event.target; const file = input.files && input.files[0]; if (!file) return;
    const form = new FormData(); form.append('file', file);
    try {
      const res = await fetch('/api/media/upload', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || 'Upload failed.');
      const url = data.asset?.url;
      if (activeUploadImage) { activeUploadImage.src = url; activeUploadImage.alt = file.name.replace(/\.[^.]+$/, ''); }
      else { insertHtmlAtCursor(`<figure><img src="${escapeAttr(url)}" alt="${escapeAttr(file.name.replace(/\.[^.]+$/, ''))}"><figcaption>Caption</figcaption></figure>`); }
      toast('Image uploaded. Click Save Changes to keep it on the page.');
    } catch (err) { alert(err.message); }
    finally { input.value = ''; activeUploadImage = null; }
  }

  function toast(text) { let el = document.querySelector('#inlineEditToast'); if (!el) { el = document.createElement('div'); el.id = 'inlineEditToast'; el.className = 'inline-edit-toast'; document.body.appendChild(el); } el.textContent = text; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2200); }
  function escapeHtml(value) { return String(value).replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function escapeAttr(value) { return escapeHtml(value).replace(/'/g, '&#39;'); }

  document.addEventListener('DOMContentLoaded', async () => { await loadMeForEditing(); await loadHomeBubbles(); await loadEditablePage(); });
})();
