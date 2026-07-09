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
  function pathKey(){ return PATHS[(location.pathname.split('/').pop()||'')]; }
  function parseBuildJson(b){ try { return JSON.parse(b.build_json || '{}'); } catch { return {}; } }
  function skillSetupHtml(b){
    const snap = parseBuildJson(b);
    const skills = Array.isArray(snap.skills) ? snap.skills : [];
    if(!skills.length) return '';
    const techniques = skills.filter(s => String(s.slot || s.type || '').toLowerCase().includes('technique')).slice(0,4);
    const charms = skills.filter(s => String(s.slot || s.type || '').toLowerCase().includes('charm')).slice(0,4);
    const ordered = techniques.concat(charms).slice(0,8);
    return `<section class="published-skill-setup compact-build-skills">
      <div class="skill-row-title">Techniques</div>
      <div class="published-skill-grid circle-skill-grid first-row">${techniques.map(skillCircle).join('')}${emptySkillSlots(4-techniques.length).join('')}</div>
      <div class="skill-row-title">Charms</div>
      <div class="published-skill-grid circle-skill-grid second-row">${charms.map(skillCircle).join('')}${emptySkillSlots(4-charms.length).join('')}</div>
    </section>`;
  }
  function skillCircle(s){
    const desc = esc(s.description || '');
    return `<article class="published-skill-circle" title="${desc}">
      <span class="skill-orb"><img src="${esc(s.icon)}" alt="${esc(s.name)}" onerror="this.onerror=null;this.src='${esc(s.fallbackIcon || '')}'"></span>
      <strong>${esc(s.name)}</strong>
    </article>`;
  }
  function emptySkillSlots(n){
    return Array.from({length: Math.max(0,n)}, () => `<article class="published-skill-circle empty"><span class="skill-orb"></span><strong>Empty</strong></article>`);
  }
  function mount(){
    const path=pathKey(); if(!path) return;
    const main=document.querySelector('main'); if(!main) return;
    const sec=document.createElement('section'); sec.className='section member-build-section'; sec.innerHTML=`
      <article class="guide-article build-submit-card">
        <h2>Save Your Build</h2>
        <p class="muted">Members can save builds directly to this page. Add notes and an optional screenshot, or publish straight from Build Lab to include skill images, names, and descriptions automatically.</p>
        <form id="memberBuildForm" class="member-build-form" hidden>
          <div class="form-row two"><label>Build Title<input name="title" required placeholder="Example: Ravager PvE Boss Build"></label><label>Class<select name="class_name">${(CLASS_OPTIONS[path]||[]).map(c=>`<option>${c}</option>`).join('')}</select></label></div>
          <label>Tags<input name="tags" placeholder="PvE, Boss, Arena, F2P, Whale"></label>
          <label>Import Code<textarea name="import_code" rows="5" placeholder="Paste build import code here"></textarea></label>
          <label>Notes<textarea name="notes" rows="5" placeholder="Gear, cloak stats, rotations, why it works, etc."></textarea></label>
          <label>Screenshot/Image<input id="buildImageFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label>
          <div id="buildImageStatus" class="muted"></div>
          <button class="gold-button" type="submit">Save Build to This Page</button>
        </form>
        <p id="memberBuildSignin" class="muted" hidden><a href="account.html">Sign in</a> to save your build to this page.</p>
        <p id="memberBuildMsg" class="muted"></p>
      </article>
      <div id="memberBuildList" class="member-build-list"></div>`;
    main.appendChild(sec);
    document.querySelector('#memberBuildForm')?.addEventListener('submit', saveBuild);
    document.querySelector('#buildImageFile')?.addEventListener('change', uploadImage);
    init();
  }
  async function init(){
    try{ me=await jsonFetch('/api/me'); }catch{ me={signedIn:false}; }
    document.querySelector('#memberBuildForm').hidden=!me.signedIn;
    document.querySelector('#memberBuildSignin').hidden=!!me.signedIn;
    await loadBuilds();
  }
  async function uploadImage(e){
    const file=e.target.files&&e.target.files[0]; if(!file) return;
    const status=document.querySelector('#buildImageStatus'); status.textContent='Uploading image...';
    const fd=new FormData(); fd.append('file',file);
    try{ const d=await jsonFetch('/api/media/upload',{method:'POST',body:fd}); uploadedImageUrl=d.asset?.url||''; status.innerHTML=uploadedImageUrl?`Uploaded: <a href="${esc(uploadedImageUrl)}" target="_blank">view image</a>`:'Uploaded.'; }
    catch(err){ status.textContent=err.message||'Upload failed.'; }
  }
  async function saveBuild(e){
    e.preventDefault(); const f=e.currentTarget; const msg=document.querySelector('#memberBuildMsg'); msg.textContent='Saving...';
    const body={path:pathKey(),title:f.title.value,class_name:f.class_name.value,tags:f.tags.value,import_code:f.import_code.value,notes:f.notes.value,image_url:uploadedImageUrl,visibility:'public'};
    try{ await jsonFetch('/api/builds/save',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}); f.reset(); uploadedImageUrl=''; document.querySelector('#buildImageStatus').textContent=''; msg.textContent='Build saved to this page.'; await loadBuilds(); }
    catch(err){ msg.textContent=err.message||'Could not save build.'; }
  }
  async function loadBuilds(){
    const wrap=document.querySelector('#memberBuildList'); if(!wrap) return;
    try{
      const d=await jsonFetch('/api/builds/list?path='+encodeURIComponent(pathKey()));
      const builds=d.builds||[];
      if(!builds.length){
        wrap.innerHTML='<article class="guide-article"><h2>Member Builds</h2><p class="muted">No member builds saved yet.</p></article>';
        return;
      }
      wrap.innerHTML='<article class="guide-article"><h2>Member Builds</h2></article>'+builds.map(b=>`<article class="build-card saved-build published-build-card">
        <div class="published-build-head"><div><p class="kicker">Created by ${esc(b.ingame_name||b.username||'Member')}</p><h3>${esc(b.title)}</h3></div><span>${esc(b.class_name)}</span></div>
        ${b.notes?`<p class="published-build-desc">${esc(b.notes).replace(/\n/g,'<br>')}</p>`:''}
        ${skillSetupHtml(b)}
      </article>`).join('');
    } catch(err){
      wrap.innerHTML=`<article class="guide-article"><h2>Member Builds</h2><p class="error">${esc(err.message)}</p></article>`;
    }
  }
  document.addEventListener('DOMContentLoaded', mount);
})();
