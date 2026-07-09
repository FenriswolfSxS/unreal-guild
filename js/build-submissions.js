
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
  function mount(){
    const path=pathKey(); if(!path) return;
    const main=document.querySelector('main'); if(!main) return;
    const sec=document.createElement('section'); sec.className='section member-build-section'; sec.innerHTML=`
      <article class="guide-article build-submit-card">
        <h2>Save Your Build</h2>
        <p class="muted">Members can save builds directly to this page. Add the import code, notes, tags, and an optional screenshot.</p>
        <form id="memberBuildForm" class="member-build-form" hidden>
          <div class="form-row two"><label>Build Title<input name="title" required placeholder="Example: Ravager PvE Boss Build"></label><label>Class<select name="class_name">${(CLASS_OPTIONS[path]||[]).map(c=>`<option>${c}</option>`).join('')}</select></label></div>
          <label>Tags<input name="tags" placeholder="PvE, Boss, Arena, F2P, Whale"></label>
          <label>Import Code<textarea name="import_code" rows="5" placeholder="Paste build import code here"></textarea></label>
          <label>Notes<textarea name="notes" rows="5" placeholder="Gear, cloak stats, skills, charms, rotations, etc."></textarea></label>
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
    const body={path:pathKey(),title:f.title.value,class_name:f.class_name.value,tags:f.tags.value,import_code:f.import_code.value,notes:f.notes.value,image_url:uploadedImageUrl};
    try{ await jsonFetch('/api/builds/save',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}); f.reset(); uploadedImageUrl=''; document.querySelector('#buildImageStatus').textContent=''; msg.textContent='Build saved to this page.'; await loadBuilds(); }
    catch(err){ msg.textContent=err.message||'Could not save build.'; }
  }
  async function loadBuilds(){
    const wrap=document.querySelector('#memberBuildList'); if(!wrap) return;
    try{ const d=await jsonFetch('/api/builds/list?path='+encodeURIComponent(pathKey())); const builds=d.builds||[]; if(!builds.length){wrap.innerHTML='<article class="guide-article"><h2>Member Builds</h2><p class="muted">No member builds saved yet.</p></article>'; return;} wrap.innerHTML='<article class="guide-article"><h2>Member Builds</h2></article>'+builds.map(b=>`<article class="build-card saved-build"><div class="build-card-header"><h3>${esc(b.title)}</h3><span>${esc(b.class_name)}</span></div><p class="muted">By ${esc(b.ingame_name||b.username||'Member')} • ${esc(b.tags)}</p>${b.image_url?`<img class="saved-build-image" src="${esc(b.image_url)}" alt="${esc(b.title)} screenshot">`:''}${b.import_code?`<h4>Import Code</h4><pre>${esc(b.import_code)}</pre>`:''}${b.notes?`<h4>Notes</h4><p>${esc(b.notes).replace(/\n/g,'<br>')}</p>`:''}</article>`).join(''); }
    catch(err){ wrap.innerHTML=`<article class="guide-article"><h2>Member Builds</h2><p class="error">${esc(err.message)}</p></article>`; }
  }
  document.addEventListener('DOMContentLoaded', mount);
})();
