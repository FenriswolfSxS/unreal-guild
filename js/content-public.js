(function () {
  let editPermissions = [];
  let me = null;
  let activeUploadImage = null;
  let homeBubbles = [];
  let dragState = null;
  let activeHomeText = null;

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
      let x = savedPlaced ? Number(b.pos_x || 0) : defaultX;
      let y = savedPlaced ? Number(b.pos_y || 0) : defaultY;
      const w = Number(b.width || 260), h = Number(b.height || 190);
      x = Math.max(0, Math.min(x, 1120 - Math.min(w, 1120)));
      y = Math.max(0, Math.min(y, 620 - Math.min(h, 620)));
      const placed = true;
      return `<article class="notice-card editable-bubble rune-bubble" data-bubble-id="${b.id}" style="${placed ? `left:${x}px;top:${y}px;width:${w}px;min-height:${h}px;` : ''}">
        <span class="edit-chip">Move • Resize • Style</span>
        <span class="bubble-move-handle" title="Drag this to move">✦</span>
        <h2 contenteditable="false" style="${escapeAttr(b.title_style || '')}">${escapeHtml(b.title || '')}</h2>
        <p contenteditable="false" style="${escapeAttr(b.body_style || '')}">${escapeHtml(b.body || '')}</p>
        ${b.button_label && b.button_link ? `<a class="bubble-link" href="${escapeAttr(b.button_link)}">${escapeHtml(b.button_label)} →</a>` : ''}
        <span class="bubble-resize-handle" title="Drag to resize"></span>
      </article>`;
    }).join('');
    grid.addEventListener('pointerdown', startBubblePointer, true);
    grid.addEventListener('input', updateBubbleFromDom, true);
  }

  function setHomeEditing(on) {
    if (!document.querySelector('[data-home-bubbles]')) return;
    document.querySelectorAll('.editable-bubble h2,.editable-bubble p').forEach(el => { el.contentEditable = on ? 'true' : 'false'; if (on) { el.addEventListener('focus', rememberHomeTextTarget); el.addEventListener('click', rememberHomeTextTarget); } });
    if (on) addHomeToolbar(); else removeHomeToolbar();
  }

  function addHomeToolbar() {
    if (!canEdit('edit_home')) return;
    if (document.querySelector('#homeEditToolbar')) return;
    const bar = document.createElement('div');
    bar.id = 'homeEditToolbar';
    bar.className = 'inline-edit-toolbar home-edit-toolbar';
    bar.innerHTML = `<button type="button" data-home-action="save">Save Home</button><button type="button" data-home-action="reset">Reset Layout</button><label>Size <select data-home-style="font-size"><option value="">Default</option><option value="0.9rem">Small</option><option value="1rem">Normal</option><option value="1.25rem">Large</option><option value="1.5rem">XL</option><option value="2rem">XXL</option><option value="2.5rem">Hero</option></select></label><label>Color <input data-home-style="color" type="color" value="#ffffff"></label><button type="button" data-home-style="font-weight" data-value="900">Bold</button><button type="button" data-home-style="font-style" data-value="italic">Italic</button><span class="inline-edit-hint">Drag ✦ to move. Resize from corner. Click title/body then style it.</span>`;
    document.body.appendChild(bar);
    bar.addEventListener('click', (event) => {
      if (event.target.closest('[data-home-action="save"]')) saveHomeBubbles().catch(err => alert(err.message));
      if (event.target.closest('[data-home-action="reset"]')) resetHomeLayout();
      const styleBtn = event.target.closest('button[data-home-style]');
      if (styleBtn) applyHomeStyle(styleBtn.dataset.homeStyle, styleBtn.dataset.value || '');
    });
    bar.addEventListener('input', (event) => {
      const control = event.target.closest('[data-home-style]');
      if (!control || control.tagName === 'BUTTON') return;
      applyHomeStyle(control.dataset.homeStyle, control.value);
    });
  }
  function removeHomeToolbar() { document.querySelector('#homeEditToolbar')?.remove(); }

  function rememberHomeTextTarget(event) {
    const el = event.target.closest('.editable-bubble h2,.editable-bubble p');
    if (!el) return;
    activeHomeText = el;
    document.querySelectorAll('.home-active-text').forEach(x => x.classList.remove('home-active-text'));
    el.classList.add('home-active-text');
  }

  function resetHomeLayout() {
    const defaults = [
      { x:0, y:0, w:260, h:190 }, { x:285, y:0, w:260, h:190 },
      { x:570, y:0, w:260, h:190 }, { x:855, y:0, w:260, h:190 }
    ];
    document.querySelectorAll('.editable-bubble').forEach((card, idx) => {
      const d = defaults[idx] || { x:(idx%4)*285, y:Math.floor(idx/4)*220, w:260, h:190 };
      card.style.left = d.x + 'px'; card.style.top = d.y + 'px'; card.style.width = d.w + 'px'; card.style.minHeight = d.h + 'px';
    });
    updateBubbleFromDom();
  }

  function applyHomeStyle(prop, value) {
    if (!activeHomeText) return;
    if (prop === 'font-size') activeHomeText.style.fontSize = value || '';
    if (prop === 'color') activeHomeText.style.color = value || '';
    if (prop === 'font-weight') activeHomeText.style.fontWeight = activeHomeText.style.fontWeight === value ? '' : value;
    if (prop === 'font-style') activeHomeText.style.fontStyle = activeHomeText.style.fontStyle === value ? '' : value;
    updateBubbleFromDom();
  }

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
    dragState = { card, mode: resize ? 'resize' : 'move', startX:event.clientX, startY:event.clientY, grabX: event.clientX - cr.left, grabY: event.clientY - cr.top, left: cr.left - sr.left, top: cr.top - sr.top, width: cr.width, height: cr.height };
    card.classList.add('is-dragging');
    card.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointermove', moveBubblePointer);
    window.addEventListener('pointerup', endBubblePointer, { once:true });
  }
  function moveBubblePointer(event) {
    if (!dragState) return;
    const dx = event.clientX - dragState.startX, dy = event.clientY - dragState.startY;
    const stage = document.querySelector('[data-home-stage]');
    const maxLeft = Math.max(0, (stage?.clientWidth || 1120) - dragState.card.getBoundingClientRect().width - 4);
    const maxTop = Math.max(0, (stage?.clientHeight || 620) - dragState.card.getBoundingClientRect().height - 4);
    if (dragState.mode === 'move') {
      const sr = stage.getBoundingClientRect();
      const nextLeft = Math.min(maxLeft, Math.max(0, event.clientX - sr.left - dragState.grabX));
      const nextTop = Math.min(maxTop, Math.max(0, event.clientY - sr.top - dragState.grabY));
      dragState.card.style.left = nextLeft + 'px';
      dragState.card.style.top = nextTop + 'px';
    } else {
      const maxWidth = Math.max(180, (stage?.clientWidth || 1120) - dragState.left - 4);
      const maxHeight = Math.max(140, (stage?.clientHeight || 620) - dragState.top - 4);
      dragState.card.style.width = Math.min(maxWidth, Math.max(180, dragState.width + dx)) + 'px';
      dragState.card.style.minHeight = Math.min(maxHeight, Math.max(140, dragState.height + dy)) + 'px';
    }
    updateBubbleFromDom();
  }
  function endBubblePointer() {
    window.removeEventListener('pointermove', moveBubblePointer);
    dragState?.card?.classList.remove('is-dragging');
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
      const h2 = card.querySelector('h2'), p = card.querySelector('p');
      b.title_style = h2 ? styleToSave(h2) : '';
      b.body_style = p ? styleToSave(p) : '';
    });
    renderQuickClicks();
  }

  function styleToSave(el) {
    const parts = [];
    if (el.style.color) parts.push('color:' + rgbToHex(el.style.color));
    if (el.style.fontSize) parts.push('font-size:' + el.style.fontSize);
    if (el.style.fontWeight) parts.push('font-weight:' + el.style.fontWeight);
    if (el.style.fontStyle) parts.push('font-style:' + el.style.fontStyle);
    if (el.style.textAlign) parts.push('text-align:' + el.style.textAlign);
    return parts.join(';');
  }
  function rgbToHex(color) {
    if (!color || color.startsWith('#')) return color;
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return color;
    return '#' + [m[1],m[2],m[3]].map(n => Math.max(0, Math.min(255, Number(n))).toString(16).padStart(2,'0')).join('');
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

  function makeId() { return crypto.randomUUID(); }
  function makeRow(columnCount = 1, blocks = []) {
    const count = Math.max(1, Math.min(3, Number(columnCount) || 1));
    const columns = Array.from({ length: count }, (_, i) => Array.isArray(blocks[i]) ? blocks[i] : []);
    return { id: makeId(), type: 'row', columns };
  }

  function normalizeLegacyToRows(root) {
    const rows = [];
    const isHome = (root.dataset.editablePage || root.dataset.inlineGuidePage) === 'home';
    if (isHome) {
      const cards = [...root.querySelectorAll('article.notice-card, article.editable-bubble')];
      const blocks = cards.map((node) => ({
        id: makeId(), type: 'callout',
        title: node.querySelector('h2,h3')?.textContent?.trim() || 'New section',
        html: `<p>${escapeHtml(node.querySelector('p')?.textContent?.trim() || '')}</p>`
      }));
      for (let i = 0; i < blocks.length; i += 2) rows.push(makeRow(Math.min(2, blocks.length - i), blocks.slice(i, i + 2).map(b => [b])));
      if (!rows.length) rows.push(makeRow(1, [[{ id:makeId(), type:'text', html:'<p>Start writing here.</p>' }]]));
      return rows;
    }
    [...root.children].forEach((node) => {
      const tag = node.tagName?.toLowerCase();
      if (!tag) return;
      let block;
      if (/^h[1-6]$/.test(tag)) block = { id: makeId(), type:'heading', level:Number(tag[1]) || 2, text:node.textContent || '' };
      else if (tag === 'figure') {
        const img = node.querySelector('img');
        block = { id:makeId(), type:'image', src:img?.getAttribute('src') || '', alt:img?.getAttribute('alt') || '', caption:node.querySelector('figcaption')?.textContent || '' };
      } else if (tag === 'img') block = { id:makeId(), type:'image', src:node.getAttribute('src') || '', alt:node.getAttribute('alt') || '', caption:'' };
      else if (tag === 'hr') block = { id:makeId(), type:'divider' };
      else if (tag === 'a' && node.classList.contains('page-button')) block = { id:makeId(), type:'button', label:node.textContent || 'Button', url:node.getAttribute('href') || '#' };
      else block = { id:makeId(), type:'text', html:node.outerHTML || `<p>${escapeHtml(node.textContent || '')}</p>` };
      rows.push(makeRow(1, [[block]]));
    });
    if (!rows.length) rows.push(makeRow(1, [[{ id:makeId(), type:'text', html:'<p>Start writing here.</p>' }]]));
    return rows;
  }

  function sanitizeBlock(block) {
    if (!block || typeof block !== 'object') return null;
    const type = String(block.type || 'text');
    return { ...block, id:String(block.id || makeId()), type };
  }

  function sanitizeRows(input) {
    if (!Array.isArray(input)) return [];
    const rows = [];
    input.slice(0, 100).forEach((item) => {
      if (item?.type === 'row' && Array.isArray(item.columns)) {
        const columns = item.columns.slice(0,3).map(col => Array.isArray(col) ? col.map(sanitizeBlock).filter(Boolean).slice(0,50) : []);
        rows.push({ id:String(item.id || makeId()), type:'row', columns:columns.length ? columns : [[]] });
        return;
      }
      const legacy = sanitizeBlock(item);
      if (!legacy) return;
      if (legacy.type === 'columns') {
        rows.push(makeRow(2, [
          [{ id:makeId(), type:'text', html:legacy.leftHtml || '<p>Left column</p>' }],
          [{ id:makeId(), type:'text', html:legacy.rightHtml || '<p>Right column</p>' }]
        ]));
      } else rows.push(makeRow(1, [[legacy]]));
    });
    return rows;
  }

  function blockControls() {
    return `<div class="page-block-controls" contenteditable="false"><span class="page-block-drag" draggable="true" title="Drag to another column or position">⋮⋮</span><button type="button" data-block-action="up" title="Move up">↑</button><button type="button" data-block-action="down" title="Move down">↓</button><button type="button" data-block-action="duplicate" title="Duplicate">⧉</button><button type="button" data-block-action="delete" title="Delete">✕</button></div>`;
  }

  const allowedFonts = {
    'inherit':'Guild Default',
    'system-ui':'Modern',
    '"Trebuchet MS",sans-serif':'Tech',
    'Georgia,serif':'Epic Serif',
    '"Arial Black",Impact,sans-serif':'Heavy',
    '"Courier New",monospace':'Terminal'
  };
  function safeTextStyle(block) {
    const st = block?.textStyle && typeof block.textStyle === 'object' ? block.textStyle : {};
    const size = Math.max(12, Math.min(72, Number(st.size) || 0));
    const font = Object.prototype.hasOwnProperty.call(allowedFonts, st.font) ? st.font : 'inherit';
    const align = ['left','center','right'].includes(st.align) ? st.align : '';
    const color = /^#[0-9a-f]{6}$/i.test(st.color || '') ? st.color : '';
    const css = [];
    if (size) css.push(`font-size:${size}px`);
    if (font !== 'inherit') css.push(`font-family:${font}`);
    if (align) css.push(`text-align:${align}`);
    if (color) css.push(`color:${color}`);
    if (st.bold) css.push('font-weight:800');
    if (st.italic) css.push('font-style:italic');
    if (st.underline) css.push('text-decoration:underline');
    return css.join(';');
  }
  function styleAttr(block) {
    const css = safeTextStyle(block);
    return css ? ` style="${escapeAttr(css)}"` : '';
  }

  function blockHtml(block, editing=false) {
    const editable = editing ? ' contenteditable="true"' : '';
    const controls = editing ? blockControls() : '';
    let body = '';
    if (block.type === 'heading') body = `<h${Math.min(4,Math.max(2,Number(block.level)||2))} data-block-field="text"${styleAttr(block)}${editable}>${escapeHtml(block.text || 'New heading')}</h${Math.min(4,Math.max(2,Number(block.level)||2))}>`;
    else if (block.type === 'image') body = `<figure class="modular-image"><img data-block-image src="${escapeAttr(block.src || '')}" alt="${escapeAttr(block.alt || 'Page image')}" loading="lazy"><figcaption data-block-field="caption"${styleAttr(block)}${editable}>${escapeHtml(block.caption || 'Caption')}</figcaption>${editing ? '<button class="replace-block-image" type="button" data-block-action="replace-image" contenteditable="false">Replace image</button>' : ''}</figure>`;
    else if (block.type === 'divider') body = '<hr class="modular-divider">';
    else if (block.type === 'button') body = `<div class="modular-button-editor"><a class="page-button" data-block-link href="${escapeAttr(block.url || '#')}"${styleAttr(block)}><span data-block-field="label"${editable}>${escapeHtml(block.label || 'Button')}</span></a>${editing ? `<input data-block-field-input="url" type="url" value="${escapeAttr(block.url || '#')}" placeholder="https://…" contenteditable="false">` : ''}</div>`;
    else if (block.type === 'callout') body = `<aside class="modular-callout"${styleAttr(block)}><h3 data-block-field="title"${editable}>${escapeHtml(block.title || 'Important')}</h3><div data-block-field="html"${editable}>${block.html || '<p>Add callout text.</p>'}</div></aside>`;
    else body = `<div class="modular-text" data-block-field="html"${styleAttr(block)}${editable}>${block.html || '<p>Write text here.</p>'}</div>`;
    return `<section class="page-block page-block-${escapeAttr(block.type)}${editing ? ' is-editing' : ''}${editing && selectedBlockId === block.id ? ' selected-block' : ''}" data-block-id="${escapeAttr(block.id)}" data-block-type="${escapeAttr(block.type)}">${controls}${body}</section>`;
  }

  function rowHtml(row, editing=false) {
    const columns = row.columns || [[]];
    const rowControls = editing ? `<div class="page-row-controls" contenteditable="false"><span class="page-row-label">${columns.length === 1 ? 'Full width' : columns.length + ' side-by-side'}</span><button type="button" data-row-action="up" title="Move row up">↑</button><button type="button" data-row-action="down" title="Move row down">↓</button><button type="button" data-row-action="duplicate" title="Duplicate row">⧉</button><button type="button" data-row-action="delete" title="Delete row">✕</button></div>` : '';
    const cols = columns.map((blocks, index) => `<div class="page-column${editing ? ' is-editing' : ''}" data-row-id="${escapeAttr(row.id)}" data-column-index="${index}">${editing ? `<button type="button" class="column-select-button" data-column-action="select">Add content here</button>` : ''}${blocks.map(b => blockHtml(b, editing)).join('')}${editing ? '<div class="column-drop-hint">Drop content here</div>' : ''}</div>`).join('');
    return `<section class="page-row page-row-${columns.length}${editing ? ' is-editing' : ''}" data-row-id="${escapeAttr(row.id)}">${rowControls}<div class="page-row-grid" style="--page-columns:${columns.length}">${cols}</div></section>`;
  }

  let pageRows = [];
  let selectedColumn = null;
  let draggingBlock = null;
  let selectedBlockId = null;

  function renderPageRows(editing = document.body.classList.contains('leadership-edit-on')) {
    const root = editableRoot(); if (!root) return;
    root.classList.add('modular-page-root');
    root.innerHTML = pageRows.map(row => rowHtml(row, editing)).join('');
    if ((root.dataset.editablePage || root.dataset.inlineGuidePage) === 'home') renderStructuredHomeQuickLinks(root);
    if (editing && selectedColumn) {
      root.querySelector(`.page-column[data-row-id="${CSS.escape(selectedColumn.rowId)}"][data-column-index="${selectedColumn.columnIndex}"]`)?.classList.add('selected-column');
    }
    updateTextStyleToolbar();
  }

  function renderStructuredHomeQuickLinks(root) {
    const wrap = document.querySelector('[data-home-quick-clicks]');
    if (!wrap) return;
    const links = allBlocks().filter(x => ['callout','heading'].includes(x.block.type)).slice(0,8);
    wrap.innerHTML = links.map(x => `<button type="button" data-jump-block="${escapeAttr(x.block.id)}">${escapeHtml(x.block.title || x.block.text || 'Section')}</button>`).join('');
    if (!wrap.dataset.boundStructured) {
      wrap.dataset.boundStructured = '1';
      wrap.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-jump-block]'); if (!btn) return;
        const block = root.querySelector(`[data-block-id="${CSS.escape(btn.dataset.jumpBlock)}"]`);
        block?.scrollIntoView({behavior:'smooth',block:'center'});
        block?.classList.add('bubble-pulse'); setTimeout(()=>block?.classList.remove('bubble-pulse'),1100);
      });
    }
  }

  async function loadEditablePage() {
    const target = editableRoot(); if (!target) return;
    const pageKey = target.dataset.inlineGuidePage || target.dataset.editablePage || pageKeyFromPath();
    try {
      const data = await fetchJson('/api/content/page?page_key=' + encodeURIComponent(pageKey));
      const json = data.page?.content_json;
      if (json) {
        try { pageRows = sanitizeRows(typeof json === 'string' ? JSON.parse(json) : json); } catch (_) { pageRows = []; }
      }
      if (!pageRows.length) {
        const html = data.page?.content_html || '';
        if (html && !isLegacyPlaceholder(pageKey, html)) target.innerHTML = html;
        pageRows = normalizeLegacyToRows(target);
      }
      renderPageRows(false);
    } catch (_) { pageRows = normalizeLegacyToRows(target); renderPageRows(false); }
  }

  function addInlineToolbar() {
    if (document.querySelector('#inlineEditToolbar')) return;
    const bar = document.createElement('div');
    bar.id = 'inlineEditToolbar'; bar.className = 'inline-edit-toolbar modular-toolbar';
    bar.innerHTML = `<button class="builder-primary" type="button" data-inline-action="save">✓ Save Page</button><div class="row-add-menu"><span class="builder-menu-label">Add layout</span><button type="button" data-row-add="1">＋ Full Width</button><button type="button" data-row-add="2">＋ Side by Side</button><button type="button" data-row-add="3">＋ Three Across</button></div><div class="block-add-menu"><span class="builder-menu-label">Add content</span><button type="button" data-inline-action="heading">Heading</button><button type="button" data-inline-action="text">Text</button><button type="button" data-inline-action="image">Photo</button><button type="button" data-inline-action="callout">Card</button><button type="button" data-inline-action="button">Link Button</button><button type="button" data-inline-action="divider">Divider</button></div><div class="text-style-menu" aria-label="Text style controls"><span class="builder-menu-label">Text style</span><select data-text-style="font" title="Font"><option value="inherit">Guild Default</option><option value="system-ui">Modern</option><option value='"Trebuchet MS",sans-serif'>Tech</option><option value="Georgia,serif">Epic Serif</option><option value='"Arial Black",Impact,sans-serif'>Heavy</option><option value='"Courier New",monospace'>Terminal</option></select><select data-text-style="size" title="Text size"><option value="">Size</option><option value="14">Small</option><option value="16">Normal</option><option value="20">Large</option><option value="26">XL</option><option value="34">Hero</option><option value="48">Massive</option></select><input data-text-style="color" type="color" value="#ffffff" title="Text color"><button type="button" data-text-command="bold" title="Bold"><b>B</b></button><button type="button" data-text-command="italic" title="Italic"><i>I</i></button><button type="button" data-text-command="underline" title="Underline"><u>U</u></button><button type="button" data-text-align="left" title="Align left">≡</button><button type="button" data-text-align="center" title="Align center">≡</button><button type="button" data-text-align="right" title="Align right">≡</button><button type="button" data-text-command="clear" title="Reset text style">Reset</button></div><span class="inline-edit-hint">Select content, then style it or drag it between areas.</span><input id="inlineImageUpload" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>`;
    document.body.appendChild(bar);
    bar.addEventListener('click', handleToolbarClick);
    bar.querySelector('#inlineImageUpload').addEventListener('change', uploadInlineImage);
    bar.addEventListener('change', handleTextStyleChange);
    updateTextStyleToolbar();
  }
  function removeInlineToolbar() { document.querySelector('#inlineEditToolbar')?.remove(); }

  function setInlineEditing(on) {
    const root = editableRoot();
    if (canEdit('edit_guides') && root) {
      root.dataset.pageKey = root.dataset.inlineGuidePage || root.dataset.editablePage || pageKeyFromPath();
      root.classList.toggle('inline-edit-root', on);
      if (on && !selectedColumn && pageRows[0]) selectedColumn = { rowId:pageRows[0].id, columnIndex:0 };
      renderPageRows(on);
      if (on) addInlineToolbar(); else removeInlineToolbar();
    }
  }

  function newBlock(type) {
    const id = makeId();
    if (type === 'heading') return {id,type,level:2,text:'New section'};
    if (type === 'image') return {id,type,src:'',alt:'Page image',caption:'Caption'};
    if (type === 'callout') return {id,type,title:'Important',html:'<p>Add callout text.</p>'};
    if (type === 'button') return {id,type,label:'Button',url:'#'};
    if (type === 'divider') return {id,type};
    return {id,type:'text',html:'<p>Write new text here.</p>'};
  }

  function findColumn(rowId, columnIndex) {
    const row = pageRows.find(r => r.id === rowId);
    const col = row?.columns?.[Number(columnIndex)];
    return { row, col };
  }

  function activeColumn(createIfMissing=true) {
    if (selectedColumn) {
      const found = findColumn(selectedColumn.rowId, selectedColumn.columnIndex);
      if (found.col) return found;
    }
    if (!createIfMissing) return {};
    const row = makeRow(1, [[]]); pageRows.push(row); selectedColumn = {rowId:row.id,columnIndex:0};
    return {row,col:row.columns[0]};
  }

  function selectedBlockEntry() { return allBlocks().find(x => x.block.id === selectedBlockId); }
  function updateTextStyleToolbar() {
    const bar = document.querySelector('#inlineEditToolbar'); if (!bar) return;
    const entry = selectedBlockEntry();
    const disabled = !entry || entry.block.type === 'image' || entry.block.type === 'divider';
    bar.querySelectorAll('[data-text-style],[data-text-command],[data-text-align]').forEach(el => el.disabled = disabled);
    if (disabled) return;
    const st = entry.block.textStyle || {};
    const font = bar.querySelector('[data-text-style="font"]'); if (font) font.value = Object.prototype.hasOwnProperty.call(allowedFonts, st.font) ? st.font : 'inherit';
    const size = bar.querySelector('[data-text-style="size"]'); if (size) size.value = st.size ? String(st.size) : '';
    const color = bar.querySelector('[data-text-style="color"]'); if (color) color.value = /^#[0-9a-f]{6}$/i.test(st.color || '') ? st.color : '#ffffff';
    bar.querySelectorAll('[data-text-command]').forEach(btn => btn.classList.toggle('is-active', !!st[btn.dataset.textCommand]));
    bar.querySelectorAll('[data-text-align]').forEach(btn => btn.classList.toggle('is-active', st.align === btn.dataset.textAlign));
  }
  function applySelectedTextStyle(patch) {
    syncRowsFromDom();
    const entry = selectedBlockEntry(); if (!entry || ['image','divider'].includes(entry.block.type)) return;
    entry.block.textStyle = { ...(entry.block.textStyle || {}), ...patch };
    Object.keys(entry.block.textStyle).forEach(k => { if (entry.block.textStyle[k] === '' || entry.block.textStyle[k] == null || entry.block.textStyle[k] === false) delete entry.block.textStyle[k]; });
    renderPageRows(true); updateTextStyleToolbar();
  }
  function handleTextStyleChange(event) {
    const control = event.target.closest('[data-text-style]'); if (!control) return;
    if (control.dataset.textStyle === 'size') applySelectedTextStyle({size:control.value ? Number(control.value) : ''});
    if (control.dataset.textStyle === 'font') applySelectedTextStyle({font:control.value});
    if (control.dataset.textStyle === 'color') applySelectedTextStyle({color:control.value});
  }

  async function handleToolbarClick(event) {
    const command = event.target.closest('[data-text-command]');
    if (command) {
      const entry = selectedBlockEntry(); if (!entry) return;
      const key = command.dataset.textCommand;
      if (key === 'clear') { syncRowsFromDom(); entry.block.textStyle = {}; renderPageRows(true); updateTextStyleToolbar(); return; }
      applySelectedTextStyle({[key]:!entry.block.textStyle?.[key]}); return;
    }
    const align = event.target.closest('[data-text-align]');
    if (align) { applySelectedTextStyle({align:align.dataset.textAlign}); return; }
    const rowBtn = event.target.closest('[data-row-add]');
    if (rowBtn) {
      syncRowsFromDom();
      const row = makeRow(Number(rowBtn.dataset.rowAdd), []);
      pageRows.push(row); selectedColumn = {rowId:row.id,columnIndex:0}; renderPageRows(true);
      editableRoot()?.querySelector(`[data-row-id="${CSS.escape(row.id)}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    const btn = event.target.closest('[data-inline-action]'); if (!btn) return;
    const action = btn.dataset.inlineAction;
    if (action === 'save') return saveInlinePage();
    if (action === 'image') { activeUploadImage = {mode:'new', target:selectedColumn}; document.querySelector('#inlineImageUpload')?.click(); return; }
    syncRowsFromDom();
    const {col} = activeColumn(); col.push(newBlock(action)); renderPageRows(true);
  }

  function allBlocks() {
    const result = [];
    pageRows.forEach((row, rowIndex) => row.columns.forEach((col, columnIndex) => col.forEach((block, blockIndex) => result.push({row,rowIndex,col,columnIndex,block,blockIndex}))));
    return result;
  }

  function syncRowsFromDom() {
    const root = editableRoot(); if (!root) return;
    root.querySelectorAll('.page-block').forEach((el) => {
      const entry = allBlocks().find(x => x.block.id === el.dataset.blockId); if (!entry) return;
      const b = entry.block;
      el.querySelectorAll('[data-block-field]').forEach((field) => {
        const key = field.dataset.blockField;
        b[key] = key.toLowerCase().includes('html') ? field.innerHTML : field.textContent.trim();
      });
      el.querySelectorAll('[data-block-field-input]').forEach((field) => { b[field.dataset.blockFieldInput] = field.value.trim(); });
      const img = el.querySelector('[data-block-image]'); if (img) { b.src = img.getAttribute('src') || ''; b.alt = img.getAttribute('alt') || ''; }
    });
  }

  function publicHtmlFromRows() { return pageRows.map(row => rowHtml(row, false)).join(''); }
  async function saveInlinePage() {
    const root = editableRoot(); if (!root) return;
    syncRowsFromDom();
    const pageKey = root.dataset.pageKey || root.dataset.inlineGuidePage || root.dataset.editablePage || pageKeyFromPath();
    const title = document.querySelector('h1')?.textContent?.trim() || pageKey;
    await fetchJson('/api/content/page', { method:'PUT', headers:{'content-type':'application/json'}, body:JSON.stringify({page_key:pageKey,title,content_json:pageRows,content_html:publicHtmlFromRows()}) });
    toast('Page saved.');
  }

  document.addEventListener('click', (event) => {
    if (!document.body.classList.contains('leadership-edit-on')) return;
    const clickedBlock = event.target.closest('.page-block');
    if (clickedBlock && !event.target.closest('.page-block-controls') && !event.target.closest('.replace-block-image')) {
      syncRowsFromDom(); selectedBlockId = clickedBlock.dataset.blockId; renderPageRows(true); updateTextStyleToolbar();
      const focusTarget = editableRoot()?.querySelector(`[data-block-id="${CSS.escape(selectedBlockId)}"] [contenteditable="true"]`);
      if (event.target.closest('[contenteditable="true"]')) setTimeout(() => focusTarget?.focus(), 0);
      return;
    }
    const select = event.target.closest('[data-column-action="select"]');
    if (select) {
      const colEl = select.closest('.page-column');
      selectedColumn = { rowId:colEl.dataset.rowId, columnIndex:Number(colEl.dataset.columnIndex) };
      renderPageRows(true); return;
    }
    const rowAction = event.target.closest('[data-row-action]');
    if (rowAction) {
      event.preventDefault(); event.stopPropagation(); syncRowsFromDom();
      const rowEl = rowAction.closest('.page-row'); const idx = pageRows.findIndex(r => r.id === rowEl?.dataset.rowId); if (idx < 0) return;
      const kind = rowAction.dataset.rowAction;
      if (kind === 'delete') { if (!confirm('Delete this entire row and everything in it?')) return; pageRows.splice(idx,1); }
      if (kind === 'duplicate') { const copy=structuredClone(pageRows[idx]); copy.id=makeId(); copy.columns.forEach(col=>col.forEach(b=>b.id=makeId())); pageRows.splice(idx+1,0,copy); }
      if (kind === 'up' && idx > 0) [pageRows[idx-1],pageRows[idx]]=[pageRows[idx],pageRows[idx-1]];
      if (kind === 'down' && idx < pageRows.length-1) [pageRows[idx+1],pageRows[idx]]=[pageRows[idx],pageRows[idx+1]];
      renderPageRows(true); return;
    }
    const action = event.target.closest('[data-block-action]'); if (!action) return;
    event.preventDefault(); event.stopPropagation(); syncRowsFromDom();
    const entry = allBlocks().find(x => x.block.id === action.closest('.page-block')?.dataset.blockId); if (!entry) return;
    const kind = action.dataset.blockAction;
    if (kind === 'replace-image') { activeUploadImage = {mode:'replace', id:entry.block.id}; document.querySelector('#inlineImageUpload')?.click(); return; }
    if (kind === 'delete') { if (!confirm('Delete this block?')) return; entry.col.splice(entry.blockIndex,1); }
    if (kind === 'duplicate') { const copy=structuredClone(entry.block); copy.id=makeId(); entry.col.splice(entry.blockIndex+1,0,copy); }
    if (kind === 'up' && entry.blockIndex > 0) [entry.col[entry.blockIndex-1],entry.col[entry.blockIndex]]=[entry.col[entry.blockIndex],entry.col[entry.blockIndex-1]];
    if (kind === 'down' && entry.blockIndex < entry.col.length-1) [entry.col[entry.blockIndex+1],entry.col[entry.blockIndex]]=[entry.col[entry.blockIndex],entry.col[entry.blockIndex+1]];
    renderPageRows(true);
  }, true);

  document.addEventListener('dragstart', (event) => {
    const handle=event.target.closest('.page-block-drag'); if (!handle) return;
    const blockEl=handle.closest('.page-block'); const entry=allBlocks().find(x=>x.block.id===blockEl?.dataset.blockId); if(!entry)return;
    syncRowsFromDom(); draggingBlock={id:entry.block.id}; event.dataTransfer.effectAllowed='move'; event.dataTransfer.setData('text/plain',entry.block.id);
    blockEl.classList.add('is-dragging');
  });
  document.addEventListener('dragover', (event) => {
    if (!draggingBlock) return;
    const column=event.target.closest('.page-column'); if(!column)return;
    event.preventDefault(); document.querySelectorAll('.page-column.drag-over').forEach(x=>x.classList.remove('drag-over')); column.classList.add('drag-over');
    const targetBlock=event.target.closest('.page-block'); document.querySelectorAll('.page-block.drop-before,.page-block.drop-after').forEach(x=>x.classList.remove('drop-before','drop-after'));
    if(targetBlock){const r=targetBlock.getBoundingClientRect();targetBlock.classList.add(event.clientY<r.top+r.height/2?'drop-before':'drop-after');}
  });
  document.addEventListener('drop', (event) => {
    if (!draggingBlock) return;
    const columnEl=event.target.closest('.page-column'); if(!columnEl)return;
    event.preventDefault(); syncRowsFromDom();
    const source=allBlocks().find(x=>x.block.id===draggingBlock.id); const target=findColumn(columnEl.dataset.rowId,Number(columnEl.dataset.columnIndex)); if(!source||!target.col)return;
    const [moved]=source.col.splice(source.blockIndex,1);
    let insertAt=target.col.length; const targetBlockEl=event.target.closest('.page-block');
    if(targetBlockEl){const targetIndex=target.col.findIndex(b=>b.id===targetBlockEl.dataset.blockId);if(targetIndex>=0){const rect=targetBlockEl.getBoundingClientRect();insertAt=targetIndex+(event.clientY>=rect.top+rect.height/2?1:0);}}
    if(source.col===target.col && source.blockIndex<insertAt) insertAt--;
    target.col.splice(Math.max(0,insertAt),0,moved); selectedColumn={rowId:target.row.id,columnIndex:Number(columnEl.dataset.columnIndex)}; draggingBlock=null; renderPageRows(true);
  });
  document.addEventListener('dragend', () => { draggingBlock=null; document.querySelectorAll('.drag-over,.drop-before,.drop-after,.is-dragging').forEach(x=>x.classList.remove('drag-over','drop-before','drop-after','is-dragging')); });

  async function uploadInlineImage(event) {
    const input=event.target, file=input.files&&input.files[0]; if(!file)return;
    const pending=activeUploadImage || {mode:'new',target:selectedColumn}; const imageButton=document.querySelector('[data-inline-action="image"]'); const original=imageButton?.textContent||'+ Image';
    if(imageButton){imageButton.disabled=true;imageButton.textContent='Uploading…';} toast('Uploading image…');
    const form=new FormData(); form.append('file',file,file.name||'page-image.png');
    try {
      const data=await fetchJson('/api/media/upload',{method:'POST',body:form,credentials:'same-origin'}); const url=data.asset?.url; if(!url)throw new Error('No image URL returned.');
      syncRowsFromDom(); const alt=file.name.replace(/\.[^.]+$/,'')||'Page image';
      if(pending.mode==='replace'){const entry=allBlocks().find(x=>x.block.id===pending.id);if(entry){entry.block.src=url;entry.block.alt=alt;}}
      else {
        if(pending.target) selectedColumn=pending.target;
        const {col}=activeColumn(); col.push({id:makeId(),type:'image',src:url,alt,caption:'Caption'});
      }
      renderPageRows(true); toast('Image added. Click Save Page.');
    } catch(err){alert(err?.message||'Image upload failed.');}
    finally{input.value='';activeUploadImage=null;if(imageButton){imageButton.disabled=false;imageButton.textContent=original;}}
  }
  function toast(text) { let el=document.querySelector('#inlineEditToast'); if(!el){el=document.createElement('div');el.id='inlineEditToast';el.className='inline-edit-toast';document.body.appendChild(el);} el.textContent=text;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200); }
  function escapeHtml(value) { return String(value).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function escapeAttr(value) { return escapeHtml(value).replace(/'/g,'&#39;'); }

  document.addEventListener('DOMContentLoaded', async () => { await loadMeForEditing(); await loadHomeBubbles(); await loadEditablePage(); });
})();
