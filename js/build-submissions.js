(function(){
  const PATHS = {
    'conqueror-builds.html':'conqueror',
    'guardian-builds.html':'guardian',
    'destroyer-builds.html':'destroyer',
    'dominator-builds.html':'dominator'
  };
  const CLASS_OPTIONS = {
    conqueror:['Warrior','Duelist','Berserker','Conqueror','Ravager'],
    guardian:['Warrior','Knight','Paladin','Guardian','Templar'],
    destroyer:['Mage','Sorcerer','Archmage','Destroyer','Magister'],
    dominator:['Mage','Sage','Arcanist','Dominator','Prophet']
  };
  let me = null;
  let uploadedImageUrl = '';
  function esc(v){return String(v||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  async function jsonFetch(url, opts){ const r=await fetch(url,opts); const d=await r.json().catch(()=>({})); if(!r.ok||d.ok===false) throw new Error(d.error||'Request failed.'); return d; }
  function pathKey(){
    let page=(location.pathname.split('/').pop()||'').toLowerCase();
    if(!page) page='conqueror-builds';
    const htmlPage = page.endsWith('.html') ? page : page + '.html';
    if(PATHS[htmlPage]) return PATHS[htmlPage];
    page = page.replace(/\.html?$/,'').replace(/-builds$/,'');
    const aliases = { conqueror:'conqueror', guardian:'guardian', destroyer:'destroyer', dominator:'dominator' };
    return aliases[page] || '';
  }
  function parseBuildJson(b){ try { return JSON.parse(b.build_json || '{}'); } catch { return {}; } }
  function skillSetupHtml(b){
    const snap = parseBuildJson(b);
    const skills = Array.isArray(snap.skills) ? snap.skills : [];
    if(!skills.length) return '';
    const techniques = skills.filter(s => String(s.slot || s.type || '').toLowerCase().includes('technique')).slice(0,4);
    const charms = skills.filter(s => String(s.slot || s.type || '').toLowerCase().includes('charm')).slice(0,4);
    return `<section class="build-mini-loadout">
      <div class="loadout-row-title">Techniques</div>
      <div class="loadout-grid">${techniques.map(skillCircle).join('')}${emptySkillSlots(4-techniques.length).join('')}</div>
      <div class="loadout-row-title">Charms</div>
      <div class="loadout-grid">${charms.map(skillCircle).join('')}${emptySkillSlots(4-charms.length).join('')}</div>
    </section>`;
  }
  function skillCircle(s){
    const desc = esc(s.description || '');
    const icon = esc(s.icon || s.iconUrl || s.iconPath || s.fallbackIcon || '');
    return `<article class="loadout-skill" title="${desc}">
      <span class="loadout-orb"><img src="${icon}" alt="${esc(s.name)}" loading="lazy"></span>
      <strong>${esc(s.name)}</strong>
    </article>`;
  }
  function emptySkillSlots(n){
    return Array.from({length: Math.max(0,n)}, () => `<article class="loadout-skill empty"><span class="loadout-orb"></span><strong>Empty</strong></article>`);
  }
  function classColor(path){
    return {conqueror:'#ff6b5d', guardian:'#ffd166', destroyer:'#73b7ff', dominator:'#69ffe1'}[path] || '#c8fbff';
  }
  function mount(){
    const path=pathKey(); if(!path) return;
    const main=document.querySelector('main'); if(!main) return;
    const sec=document.createElement('section'); sec.className='section member-build-section'; sec.innerHTML=`
      <div id="memberBuildList" class="member-build-list"></div>`;
    main.appendChild(sec);
    loadBuilds();
  }
  async function loadBuilds(){
    const wrap=document.querySelector('#memberBuildList'); if(!wrap) return;
    const path = pathKey();
    try{
      const d=await jsonFetch('/api/builds/list?path='+encodeURIComponent(path));
      const builds=d.builds||[];
      if(!builds.length){
        wrap.innerHTML='<article class="empty-build-card"><h2>Member Builds</h2><p>No builds have been published here yet. Use Build Lab and choose this class path to publish one.</p></article>';
        return;
      }
      wrap.innerHTML='<div class="published-build-list">'+builds.map(b=>{
        const author = esc(b.ingame_name||b.username||'Member');
        const color = classColor(path);
        const desc = b.notes || b.description || '';
        return `<article class="guild-build-card">
          <header class="guild-build-head">
            <div>
              <p class="creator-label">Created by <strong style="color:${color}">${author}</strong></p>
              <h3>${esc(b.title)}</h3>
            </div>
            <span class="class-pill" style="border-color:${color}; color:${color};">${esc(b.class_name || path)}</span>
          </header>
          ${desc?`<div class="build-description"><p>${esc(desc).replace(/\n/g,'<br>')}</p></div>`:''}
          ${skillSetupHtml(b)}
        </article>`;
      }).join('')+'</div>';
    } catch(err){
      wrap.innerHTML=`<article class="empty-build-card"><h2>Member Builds</h2><p class="error">${esc(err.message)}</p></article>`;
    }
  }
  document.addEventListener('DOMContentLoaded', mount);
})();
