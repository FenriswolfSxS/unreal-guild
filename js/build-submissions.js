(function(){
  const PATHS = {
    'conqueror-builds.html':'conqueror', 'conqueror-builds':'conqueror',
    'guardian-builds.html':'guardian', 'guardian-builds':'guardian',
    'destroyer-builds.html':'destroyer', 'destroyer-builds':'destroyer',
    'dominator-builds.html':'dominator', 'dominator-builds':'dominator'
  };
  const COLORS = { conqueror:'#ff6b5d', guardian:'#ffd166', destroyer:'#73b7ff', dominator:'#69ffe1' };
  let me = { signedIn:false, permissions:[] };
  function canDeleteBuild(b){ const p=me.permissions||[]; const rank=String(me.user?.rank_slug||me.user?.rank_name||'').trim().toLowerCase(); const leadership=['leader','deputy','officer','admin'].includes(rank); return !!me.signedIn && (leadership || (b.created_by===me.user?.id && p.includes('delete_own_builds')) || p.includes('moderate_builds') || p.includes('admin_dashboard')); }
  function esc(v){return String(v||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  async function jsonFetch(url, opts){ const r=await fetch(url,opts); const d=await r.json().catch(()=>({})); if(!r.ok||d.ok===false) throw new Error(d.error||'Request failed.'); return d; }
  function pathKey(){
    let page=(location.pathname.split('/').pop()||'').toLowerCase().replace(/\.html?$/,'');
    if(!page && location.pathname.includes('conqueror')) page='conqueror-builds';
    if(!page) page='conqueror-builds';
    return PATHS[page] || page.replace(/-builds$/,'');
  }
  function parseBuildJson(b){ try { return JSON.parse(b.build_json || '{}'); } catch { return {}; } }
  function normalizeSkills(b){
    const snap = parseBuildJson(b);
    if (Array.isArray(snap.skills)) return snap.skills;
    const out=[];
    const add=(arr,type)=>{ (arr||[]).forEach(s=>{ if(!s) return; out.push({...s,type,slot:type}); }); };
    add(snap.techniques || snap.technique || snap.tech || snap.selectedTechniques, 'technique');
    add(snap.charms || snap.charm || snap.selectedCharms, 'charm');
    return out;
  }
  function getIcon(s){ return s.icon || s.iconUrl || s.iconPath || s.fallbackIcon || s.image || ''; }
  function skillOrb(s){
    const icon = esc(getIcon(s));
    const name = esc(s.name || 'Empty');
    const desc = esc(s.description || '');
    const img = icon ? `<img src="${icon}" alt="${name}" loading="lazy" style="width:72px!important;height:72px!important;max-width:72px!important;max-height:72px!important;object-fit:cover!important;border-radius:999px!important;display:block!important;">` : '';
    return `<div class="build-skill-orb" title="${desc}" style="display:grid!important;justify-items:center!important;align-content:start!important;gap:8px!important;min-width:0!important;text-align:center!important;">
      <span style="width:72px!important;height:72px!important;max-width:72px!important;max-height:72px!important;border-radius:999px!important;display:grid!important;place-items:center!important;overflow:hidden!important;border:1px solid rgba(255,255,255,.24)!important;background:radial-gradient(circle at 35% 25%, rgba(255,255,255,.22), rgba(142,239,255,.10) 44%, rgba(0,0,0,.34))!important;box-shadow:0 0 18px rgba(142,239,255,.18)!important;">${img}</span>
      <strong style="font-size:.82rem!important;line-height:1.15!important;color:#fff!important;max-width:110px!important;overflow-wrap:anywhere!important;text-shadow:0 1px 0 rgba(0,0,0,.55)!important;">${name}</strong>
    </div>`;
  }
  function emptyOrb(){ return `<div style="display:grid!important;justify-items:center!important;gap:8px!important;opacity:.25!important;"><span style="width:72px!important;height:72px!important;border-radius:999px!important;border:1px dashed rgba(255,255,255,.25)!important;display:block!important;"></span><strong style="font-size:.82rem!important;">Empty</strong></div>`; }
  function row(title, items){
    const filled = items.slice(0,4).map(skillOrb);
    while(filled.length<4) filled.push(emptyOrb());
    return `<div style="border-top:1px solid rgba(255,255,255,.10)!important;">
      <div style="text-align:center!important;text-transform:uppercase!important;letter-spacing:.16em!important;font-weight:900!important;font-size:.76rem!important;color:rgba(255,255,255,.68)!important;padding:9px!important;background:rgba(0,0,0,.16)!important;">${title}</div>
      <div style="display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important;padding:14px 16px!important;align-items:start!important;">${filled.join('')}</div>
    </div>`;
  }
  function skillSetupHtml(b){
    const skills = normalizeSkills(b);
    const techniques = skills.filter(s => String(s.slot || s.type || '').toLowerCase().includes('tech')).slice(0,4);
    const charms = skills.filter(s => String(s.slot || s.type || '').toLowerCase().includes('charm')).slice(0,4);
    if(!techniques.length && !charms.length) return '';
    return `<section style="margin-top:14px!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:16px!important;overflow:hidden!important;background:rgba(5,8,18,.28)!important;">${row('Techniques', techniques)}${row('Charms', charms)}</section>`;
  }
  function mount(){
    const path=pathKey();
    if(!['conqueror','guardian','destroyer','dominator'].includes(path)) return;
    const main=document.querySelector('main'); if(!main) return;
    const oldForm = main.querySelector('.save-build-panel, #saveBuildForm, .manual-build-form');
    if(oldForm) oldForm.remove();
    let sec=document.querySelector('#memberBuildMount');
    if(!sec){
      sec=document.createElement('section'); sec.id='memberBuildMount'; sec.className='section member-build-section';
      sec.innerHTML='<div id="memberBuildList" class="member-build-list"></div>';
      main.appendChild(sec);
    }
    Promise.resolve(jsonFetch('/api/me').catch(()=>({signedIn:false,permissions:[]}))).then(x=>{ me=x; loadBuilds(); });
  }
  async function loadBuilds(){
    const wrap=document.querySelector('#memberBuildList'); if(!wrap) return;
    const path = pathKey(); const color = COLORS[path] || '#c8fbff';
    try{
      const d=await jsonFetch('/api/builds/list?path='+encodeURIComponent(path)+'&v=20');
      const builds=d.builds||[];
      if(!builds.length){
        wrap.innerHTML=`<article style="border:1px solid rgba(142,239,255,.22);border-radius:22px;background:linear-gradient(135deg,rgba(33,41,68,.92),rgba(12,18,34,.94));padding:24px;max-width:860px;margin:0 auto;"><h2 style="margin-top:0;">Member Builds</h2><p>No builds have been published here yet. Use Build Lab and choose this class path to publish one.</p></article>`;
        return;
      }
      wrap.innerHTML='<div style="display:grid!important;gap:22px!important;width:min(920px,calc(100vw - 42px))!important;margin:0 auto!important;">'+builds.map(b=>{
        const author = esc(b.ingame_name||b.username||'Member');
        const desc = b.notes || b.description || '';
        return `<article class="guild-build-card compact-build-card" style="border:1px solid rgba(142,239,255,.22)!important;border-radius:22px!important;background:linear-gradient(135deg,rgba(33,41,68,.92),rgba(12,18,34,.95))!important;box-shadow:0 18px 50px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.07)!important;padding:22px!important;max-width:920px!important;overflow:hidden!important;">
          <header style="display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:18px!important;padding-bottom:12px!important;border-bottom:1px solid rgba(255,255,255,.12)!important;">
            <div><p style="margin:0!important;color:rgba(207,249,255,.78)!important;text-transform:uppercase!important;letter-spacing:.16em!important;font-size:.75rem!important;font-weight:900!important;">Created by <strong style="color:${color}!important;text-shadow:0 0 14px ${color}!important;">${author}</strong></p><h3 style="margin:6px 0 0!important;font-size:1.55rem!important;line-height:1.05!important;">${esc(b.title || 'Untitled Build')}</h3></div>
            <div style="display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:wrap!important;justify-content:flex-end!important;"><span style="flex:0 0 auto!important;border:1px solid ${color}!important;color:${color}!important;border-radius:999px!important;padding:8px 12px!important;background:rgba(255,255,255,.05)!important;font-weight:900!important;text-transform:uppercase!important;letter-spacing:.06em!important;font-size:.75rem!important;">${esc(b.class_name || path)}</span>${canDeleteBuild(b)?`<button class="build-delete-btn" type="button" data-delete-build="${esc(b.id)}">Delete Build</button>`:''}</div>
          </header>
          ${desc?`<div style="margin:14px 0 16px!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:16px!important;padding:14px 16px!important;background:rgba(5,8,18,.30)!important;color:rgba(255,255,255,.92)!important;line-height:1.55!important;"><p style="margin:0!important;">${esc(desc).replace(/\n/g,'<br>')}</p></div>`:''}
          ${skillSetupHtml(b)}
        </article>`;
      }).join('')+'</div>';
      wrap.querySelectorAll('[data-delete-build]').forEach(btn=>btn.addEventListener('click',()=>deleteBuild(btn.dataset.deleteBuild)));
    } catch(err){
      wrap.innerHTML=`<article style="border:1px solid rgba(255,95,121,.4);border-radius:22px;background:rgba(32,10,20,.45);padding:24px;max-width:860px;margin:0 auto;"><h2>Member Builds</h2><p>${esc(err.message)}</p></article>`;
    }
  }

  async function deleteBuild(id){
    if(!id || !confirm('Permanently delete this build?')) return;
    try{
      await jsonFetch('/api/builds/delete?id='+encodeURIComponent(id),{method:'DELETE'});
      await loadBuilds();
    }catch(err){ alert(err.message || 'Could not delete build.'); }
  }

  document.addEventListener('DOMContentLoaded', mount);
})();
