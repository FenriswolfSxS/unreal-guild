(function(){
  const grid = document.querySelector('#guideLibraryGrid');
  if (!grid) return;
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function json(url, options){ const r=await fetch(url,options); const d=await r.json().catch(()=>({})); if(!r.ok||d.ok===false) throw new Error(d.error||'Request failed'); return d; }
  async function load(){
    try {
      const [library,me] = await Promise.all([json('/api/guides/manage'),json('/api/me').catch(()=>({signedIn:false,permissions:[]}))]);
      (library.guides||[]).forEach(g=>{
        const card=document.createElement('article'); card.className='guide-card custom-guide-card';
        card.innerHTML=`<span class="guide-card-icon">${esc(g.icon||'📘')}</span><h2>${esc(g.title)}</h2><p>${esc(g.description||'Guild-created strategy guide.')}</p><a href="guide.html?slug=${encodeURIComponent(g.slug)}">Open Guide →</a>`;
        grid.appendChild(card);
      });
      const perms=me.permissions||[];
      if(me.signedIn&&(perms.includes('edit_guides')||perms.includes('admin_dashboard')||perms.includes('manage_site_settings'))) addCreateButton();
    } catch(err){ console.warn('Guide library:',err); }
  }
  function addCreateButton(){
    if(document.querySelector('#createGuideButton')) return;
    const wrap=document.createElement('div'); wrap.className='guide-library-admin';
    wrap.innerHTML='<button id="createGuideButton" class="guide-create-button" type="button">＋ Create New Guide Page</button>';
    grid.before(wrap); wrap.querySelector('button').addEventListener('click',openDialog);
  }
  function openDialog(){
    const modal=document.createElement('div'); modal.className='guide-create-modal';
    modal.innerHTML=`<form class="guide-create-dialog"><h2>Create a New Guide</h2><p>This creates a new editable guide page and adds it to this library automatically.</p><label>Guide title<input name="title" maxlength="100" required placeholder="Gem Guide"></label><label>Short description<textarea name="description" maxlength="500" rows="3" placeholder="Gem priorities, upgrades, and recommendations."></textarea></label><label>Icon or emoji<input name="icon" maxlength="12" value="📘"></label><div class="guide-create-actions"><button type="button" data-close>Cancel</button><button class="primary" type="submit">Create Guide</button></div></form>`;
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-close]'))modal.remove();});
    modal.querySelector('form').addEventListener('submit',async e=>{
      e.preventDefault(); const submit=e.submitter; submit.disabled=true; submit.textContent='Creating…';
      const fd=new FormData(e.currentTarget);
      try { const d=await json('/api/guides/manage',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.fromEntries(fd))}); location.href=d.guide.url; }
      catch(err){ alert(err.message); submit.disabled=false; submit.textContent='Create Guide'; }
    });
  }
  load();
})();
