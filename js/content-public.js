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

  function normalizeLegacyToBlocks(root) {
    const blocks = [];
    [...root.children].forEach((node) => {
      const tag = node.tagName?.toLowerCase();
      if (!tag) return;
      if (/^h[1-6]$/.test(tag)) blocks.push({ id: crypto.randomUUID(), type:'heading', level:Number(tag[1]) || 2, text:node.textContent || '' });
      else if (tag === 'figure') {
        const img = node.querySelector('img');
        blocks.push({ id:crypto.randomUUID(), type:'image', src:img?.getAttribute('src') || '', alt:img?.getAttribute('alt') || '', caption:node.querySelector('figcaption')?.textContent || '' });
      } else if (tag === 'img') blocks.push({ id:crypto.randomUUID(), type:'image', src:node.getAttribute('src') || '', alt:node.getAttribute('alt') || '', caption:'' });
      else if (tag === 'hr') blocks.push({ id:crypto.randomUUID(), type:'divider' });
      else if (tag === 'a' && node.classList.contains('page-button')) blocks.push({ id:crypto.randomUUID(), type:'button', label:node.textContent || 'Button', url:node.getAttribute('href') || '#' });
      else blocks.push({ id:crypto.randomUUID(), type:'text', html:node.outerHTML || `<p>${escapeHtml(node.textContent || '')}</p>` });
    });
    if (!blocks.length) blocks.push({ id:crypto.randomUUID(), type:'text', html:'<p>Start writing here.</p>' });
    return blocks;
  }

  function sanitizeBlocks(input) {
    if (!Array.isArray(input)) return [];
    return input.slice(0,100).map((b) => ({ ...b, id:String(b.id || crypto.randomUUID()), type:String(b.type || 'text') }));
  }

  function blockHtml(block, editing=false) {
    const editable = editing ? ' contenteditable="true"' : '';
    const controls = editing ? `<div class="page-block-controls" contenteditable="false"><button type="button" data-block-action="up" title="Move up">↑</button><button type="button" data-block-action="down" title="Move down">↓</button><button type="button" data-block-action="duplicate" title="Duplicate">⧉</button><button type="button" data-block-action="delete" title="Delete">✕</button><span class="page-block-drag" draggable="true" title="Drag to rearrange">⋮⋮</span></div>` : '';
    let body = '';
    if (block.type === 'heading') body = `<h${Math.min(4,Math.max(2,Number(block.level)||2))} data-block-field="text"${editable}>${escapeHtml(block.text || 'New heading')}</h${Math.min(4,Math.max(2,Number(block.level)||2))}>`;
    else if (block.type === 'image') body = `<figure class="modular-image"><img data-block-image src="${escapeAttr(block.src || '')}" alt="${escapeAttr(block.alt || 'Page image')}" loading="lazy"><figcaption data-block-field="caption"${editable}>${escapeHtml(block.caption || 'Caption')}</figcaption>${editing ? '<button class="replace-block-image" type="button" data-block-action="replace-image" contenteditable="false">Replace image</button>' : ''}</figure>`;
    else if (block.type === 'divider') body = '<hr class="modular-divider">';
    else if (block.type === 'button') body = `<div class="modular-button-editor"><a class="page-button" data-block-link href="${escapeAttr(block.url || '#')}"><span data-block-field="label"${editable}>${escapeHtml(block.label || 'Button')}</span></a>${editing ? `<input data-block-field-input="url" type="url" value="${escapeAttr(block.url || '#')}" placeholder="https://…" contenteditable="false">` : ''}</div>`;
    else if (block.type === 'callout') body = `<aside class="modular-callout"><h3 data-block-field="title"${editable}>${escapeHtml(block.title || 'Important')}</h3><div data-block-field="html"${editable}>${block.html || '<p>Add callout text.</p>'}</div></aside>`;
    else if (block.type === 'columns') body = `<div class="modular-columns"><div data-block-field="leftHtml"${editable}>${block.leftHtml || '<p>Left column</p>'}</div><div data-block-field="rightHtml"${editable}>${block.rightHtml || '<p>Right column</p>'}</div></div>`;
    else body = `<div class="modular-text" data-block-field="html"${editable}>${block.html || '<p>Write text here.</p>'}</div>`;
    return `<section class="page-block page-block-${escapeAttr(block.type)}${editing ? ' is-editing' : ''}" data-block-id="${escapeAttr(block.id)}" data-block-type="${escapeAttr(block.type)}">${controls}${body}</section>`;
  }

  let pageBlocks = [];
  let draggingBlockId = null;
  function renderPageBlocks(editing = document.body.classList.contains('leadership-edit-on')) {
    const root = editableRoot(); if (!root) return;
    root.classList.add('modular-page-root');
    root.innerHTML = pageBlocks.map(b => blockHtml(b, editing)).join('');
  }

  async function loadEditablePage() {
    const target = editableRoot(); if (!target) return;
    const pageKey = target.dataset.inlineGuidePage || target.dataset.editablePage || pageKeyFromPath();
    try {
      const data = await fetchJson('/api/content/page?page_key=' + encodeURIComponent(pageKey));
      const json = data.page?.content_json;
      if (json) {
        try { pageBlocks = sanitizeBlocks(typeof json === 'string' ? JSON.parse(json) : json); } catch (_) { pageBlocks = []; }
      }
      if (!pageBlocks.length) {
        const html = data.page?.content_html || '';
        if (html && !isLegacyPlaceholder(pageKey, html)) target.innerHTML = html;
        pageBlocks = normalizeLegacyToBlocks(target);
      }
      renderPageBlocks(false);
    } catch (_) { pageBlocks = normalizeLegacyToBlocks(target); renderPageBlocks(false); }
  }

  function addInlineToolbar() {
    if (document.querySelector('#inlineEditToolbar')) return;
    const bar = document.createElement('div');
    bar.id = 'inlineEditToolbar'; bar.className = 'inline-edit-toolbar modular-toolbar';
    bar.innerHTML = `<button type="button" data-inline-action="save">Save Page</button><div class="block-add-menu"><button type="button" data-inline-action="heading">+ Heading</button><button type="button" data-inline-action="text">+ Text</button><button type="button" data-inline-action="image">+ Image</button><button type="button" data-inline-action="columns">+ 2 Columns</button><button type="button" data-inline-action="callout">+ Callout</button><button type="button" data-inline-action="button">+ Button</button><button type="button" data-inline-action="divider">+ Divider</button></div><span class="inline-edit-hint">Edit inside each block. Drag ⋮⋮ or use arrows to rearrange.</span><input id="inlineImageUpload" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>`;
    document.body.appendChild(bar);
    bar.addEventListener('click', handleToolbarClick);
    bar.querySelector('#inlineImageUpload').addEventListener('change', uploadInlineImage);
  }
  function removeInlineToolbar() { document.querySelector('#inlineEditToolbar')?.remove(); }

  function setInlineEditing(on) {
    const root = editableRoot();
    if (canEdit('edit_guides') && root) {
      root.dataset.pageKey = root.dataset.inlineGuidePage || root.dataset.editablePage || pageKeyFromPath();
      root.classList.toggle('inline-edit-root', on);
      renderPageBlocks(on);
      if (on) addInlineToolbar(); else removeInlineToolbar();
    }
  }

  function newBlock(type) {
    const id = crypto.randomUUID();
    if (type === 'heading') return {id,type,level:2,text:'New section'};
    if (type === 'image') return {id,type,src:'',alt:'Page image',caption:'Caption'};
    if (type === 'columns') return {id,type,leftHtml:'<p>Left column</p>',rightHtml:'<p>Right column</p>'};
    if (type === 'callout') return {id,type,title:'Important',html:'<p>Add callout text.</p>'};
    if (type === 'button') return {id,type,label:'Button',url:'#'};
    if (type === 'divider') return {id,type};
    return {id,type:'text',html:'<p>Write new text here.</p>'};
  }

  async function handleToolbarClick(event) {
    const btn = event.target.closest('[data-inline-action]'); if (!btn) return;
    const action = btn.dataset.inlineAction;
    if (action === 'save') return saveInlinePage();
    if (action === 'image') { activeUploadImage = {mode:'new'}; document.querySelector('#inlineImageUpload')?.click(); return; }
    pageBlocks.push(newBlock(action)); renderPageBlocks(true);
    editableRoot()?.lastElementChild?.scrollIntoView({behavior:'smooth',block:'center'});
  }

  function syncBlocksFromDom() {
    const root = editableRoot(); if (!root) return;
    root.querySelectorAll('.page-block').forEach((el) => {
      const b = pageBlocks.find(x => x.id === el.dataset.blockId); if (!b) return;
      el.querySelectorAll('[data-block-field]').forEach((field) => {
        const key = field.dataset.blockField;
        b[key] = key.toLowerCase().includes('html') ? field.innerHTML : field.textContent.trim();
      });
      el.querySelectorAll('[data-block-field-input]').forEach((field) => { b[field.dataset.blockFieldInput] = field.value.trim(); });
      const img = el.querySelector('[data-block-image]'); if (img) { b.src = img.getAttribute('src') || ''; b.alt = img.getAttribute('alt') || ''; }
    });
  }

  function publicHtmlFromBlocks() { return pageBlocks.map(b => blockHtml(b, false)).join(''); }
  async function saveInlinePage() {
    const root = editableRoot(); if (!root) return;
    syncBlocksFromDom();
    const pageKey = root.dataset.pageKey || root.dataset.inlineGuidePage || root.dataset.editablePage || pageKeyFromPath();
    const title = document.querySelector('h1')?.textContent?.trim() || pageKey;
    await fetchJson('/api/content/page', { method:'PUT', headers:{'content-type':'application/json'}, body:JSON.stringify({page_key:pageKey,title,content_json:pageBlocks,content_html:publicHtmlFromBlocks()}) });
    toast('Page saved.');
  }

  document.addEventListener('click', (event) => {
    if (!document.body.classList.contains('leadership-edit-on')) return;
    const action = event.target.closest('[data-block-action]'); if (!action) return;
    event.preventDefault(); event.stopPropagation(); syncBlocksFromDom();
    const el = action.closest('.page-block'); const idx = pageBlocks.findIndex(b => b.id === el?.dataset.blockId); if (idx < 0) return;
    const kind = action.dataset.blockAction;
    if (kind === 'replace-image') { activeUploadImage = {mode:'replace', id:pageBlocks[idx].id}; document.querySelector('#inlineImageUpload')?.click(); return; }
    if (kind === 'delete') { if (!confirm('Delete this block?')) return; pageBlocks.splice(idx,1); }
    if (kind === 'duplicate') pageBlocks.splice(idx+1,0,{...structuredClone(pageBlocks[idx]),id:crypto.randomUUID()});
    if (kind === 'up' && idx > 0) [pageBlocks[idx-1],pageBlocks[idx]]=[pageBlocks[idx],pageBlocks[idx-1]];
    if (kind === 'down' && idx < pageBlocks.length-1) [pageBlocks[idx+1],pageBlocks[idx]]=[pageBlocks[idx],pageBlocks[idx+1]];
    renderPageBlocks(true);
  }, true);

  document.addEventListener('dragstart', (event) => { const handle=event.target.closest('.page-block-drag'); if (!handle) return; draggingBlockId=handle.closest('.page-block')?.dataset.blockId || null; event.dataTransfer.effectAllowed='move'; });
  document.addEventListener('dragover', (event) => { if (!draggingBlockId) return; const block=event.target.closest('.page-block'); if (!block) return; event.preventDefault(); block.classList.add('drag-over'); });
  document.addEventListener('dragleave', (event) => event.target.closest('.page-block')?.classList.remove('drag-over'));
  document.addEventListener('drop', (event) => { if (!draggingBlockId) return; const target=event.target.closest('.page-block'); if (!target) return; event.preventDefault(); syncBlocksFromDom(); const from=pageBlocks.findIndex(b=>b.id===draggingBlockId), to=pageBlocks.findIndex(b=>b.id===target.dataset.blockId); if(from>=0&&to>=0&&from!==to){const [m]=pageBlocks.splice(from,1);pageBlocks.splice(to,0,m);} draggingBlockId=null; renderPageBlocks(true); });
  document.addEventListener('dragend', () => { draggingBlockId=null; document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over')); });

  async function uploadInlineImage(event) {
    const input=event.target, file=input.files&&input.files[0]; if(!file)return;
    const pending=activeUploadImage || {mode:'new'}; const imageButton=document.querySelector('[data-inline-action="image"]'); const original=imageButton?.textContent||'+ Image';
    if(imageButton){imageButton.disabled=true;imageButton.textContent='Uploading…';} toast('Uploading image…');
    const form=new FormData(); form.append('file',file,file.name||'page-image.png');
    try {
      const data=await fetchJson('/api/media/upload',{method:'POST',body:form,credentials:'same-origin'}); const url=data.asset?.url; if(!url)throw new Error('No image URL returned.');
      syncBlocksFromDom(); const alt=file.name.replace(/\.[^.]+$/,'')||'Page image';
      if(pending.mode==='replace'){const b=pageBlocks.find(x=>x.id===pending.id);if(b){b.src=url;b.alt=alt;}}
      else pageBlocks.push({id:crypto.randomUUID(),type:'image',src:url,alt,caption:'Caption'});
      renderPageBlocks(true); toast('Image added. Click Save Page.');
    } catch(err){alert(err?.message||'Image upload failed.');}
    finally{input.value='';activeUploadImage=null;if(imageButton){imageButton.disabled=false;imageButton.textContent=original;}}
  }

  function toast(text) { let el=document.querySelector('#inlineEditToast'); if(!el){el=document.createElement('div');el.id='inlineEditToast';el.className='inline-edit-toast';document.body.appendChild(el);} el.textContent=text;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200); }
  function escapeHtml(value) { return String(value).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function escapeAttr(value) { return escapeHtml(value).replace(/'/g,'&#39;'); }

  document.addEventListener('DOMContentLoaded', async () => { await loadMeForEditing(); await loadHomeBubbles(); await loadEditablePage(); });
})();
