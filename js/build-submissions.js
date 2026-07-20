(function(){
  const PATHS={'conqueror-builds':'conqueror','guardian-builds':'guardian','destroyer-builds':'destroyer','dominator-builds':'dominator'};
  const COLORS={conqueror:'#ff6b5d',guardian:'#ffd166',destroyer:'#73b7ff',dominator:'#69ffe1'};
  let me={signedIn:false,permissions:[]}, builds=[], draggedId='';
  const esc=v=>String(v||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  async function jsonFetch(url,opts={}){const r=await fetch(url,{cache:'no-store',...opts});const d=await r.json().catch(()=>({}));if(!r.ok||d.ok===false)throw new Error(d.error||'Request failed.');return d;}
  function pathKey(){const page=(location.pathname.split('/').pop()||'').toLowerCase().replace(/\.html?$/,'');return PATHS[page]||page.replace(/-builds$/,'');}
  function leadership(){const p=me.permissions||[];const rank=String(me.user?.rank_slug||me.user?.rank_name||'').toLowerCase();return ['leader','deputy','officer','admin'].includes(rank)||p.includes('moderate_builds')||p.includes('admin_dashboard');}
  function canMove(b){return !!me.signedIn&&(leadership()||b.created_by===me.user?.id);}
  function canDelete(b){const p=me.permissions||[];return !!me.signedIn&&(leadership()||(b.created_by===me.user?.id&&p.includes('delete_own_builds')));}
  function parse(b){try{return JSON.parse(b.build_json||'{}')}catch{return {}}}
  function skills(b){const s=parse(b);if(Array.isArray(s.skills))return s.skills;return []}
  function orb(s){const icon=esc(s.icon||s.iconUrl||s.iconPath||s.fallbackIcon||'');return `<div class="build-skill-orb"><span>${icon?`<img src="${icon}" alt="${esc(s.name)}" loading="lazy">`:''}</span><strong>${esc(s.name||'Empty')}</strong></div>`}
  function empty(){return '<div class="build-skill-orb empty"><span></span><strong>Empty</strong></div>'}
  function skillRow(title,items){const x=items.slice(0,4).map(orb);while(x.length<4)x.push(empty());return `<div class="build-skill-row"><h4>${title}</h4><div>${x.join('')}</div></div>`}
  function setup(b){const all=skills(b),t=all.filter(x=>String(x.slot||x.type).toLowerCase().includes('tech')),c=all.filter(x=>String(x.slot||x.type).toLowerCase().includes('charm'));return (!t.length&&!c.length)?'':`<section class="build-skill-setup">${skillRow('Techniques',t)}${skillRow('Charms',c)}</section>`}
  function card(b){const color=COLORS[pathKey()]||'#c8fbff', move=canMove(b);return `<article class="guild-build-card compact-build-card" data-build-id="${esc(b.id)}" draggable="${move}">
    <header><div>${move?'<button class="build-drag-handle" type="button" title="Drag to reorder" aria-label="Drag to reorder">↕</button>':''}<p>Created by <strong style="color:${color}">${esc(b.ingame_name||b.username||'Member')}</strong></p><h3>${esc(b.title||'Untitled Build')}</h3></div><div><span style="border-color:${color};color:${color}">${esc(b.class_name||pathKey())}</span>${canDelete(b)?`<button class="build-delete-btn" data-delete-build="${esc(b.id)}">Delete Build</button>`:''}</div></header>
    ${b.notes?`<div class="build-notes">${esc(b.notes).replace(/\n/g,'<br>')}</div>`:''}${setup(b)}</article>`}
  function render(){const wrap=document.querySelector('#memberBuildList');if(!wrap)return;if(!builds.length){wrap.innerHTML='<article class="empty-build-card"><h2>Member Builds</h2><p>No builds have been published here yet.</p></article>';return}wrap.innerHTML=`<div class="member-build-grid">${builds.map(card).join('')}</div>`;bindCards();}
  function bindCards(){document.querySelectorAll('[data-delete-build]').forEach(x=>x.onclick=()=>deleteBuild(x.dataset.deleteBuild));document.querySelectorAll('[data-build-id][draggable="true"]').forEach(card=>{
    card.addEventListener('dragstart',e=>{draggedId=card.dataset.buildId;card.classList.add('is-dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',draggedId)});
    card.addEventListener('dragend',()=>{card.classList.remove('is-dragging');document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'));});
    card.addEventListener('dragover',e=>{e.preventDefault();if(card.dataset.buildId!==draggedId)card.classList.add('drag-over')});
    card.addEventListener('dragleave',()=>card.classList.remove('drag-over'));
    card.addEventListener('drop',async e=>{e.preventDefault();card.classList.remove('drag-over');const target=card.dataset.buildId;if(!draggedId||draggedId===target)return;const from=builds.findIndex(b=>b.id===draggedId),to=builds.findIndex(b=>b.id===target);const moved=builds.splice(from,1)[0];builds.splice(to,0,moved);render();try{await jsonFetch('/api/builds/reorder',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({path:pathKey(),moved_id:draggedId,ordered_ids:builds.map(b=>b.id)})})}catch(err){alert(err.message);await loadBuilds()}})
  })}
  async function loadBuilds(){const d=await jsonFetch('/api/builds/list?path='+encodeURIComponent(pathKey())+'&_='+Date.now());builds=d.builds||[];render()}
  async function deleteBuild(id){if(!confirm('Permanently delete this build?'))return;await jsonFetch('/api/builds/delete?id='+encodeURIComponent(id),{method:'DELETE'});await loadBuilds()}
  async function mount(){if(!['conqueror','guardian','destroyer','dominator'].includes(pathKey()))return;me=await jsonFetch('/api/me?_='+Date.now()).catch(()=>({signedIn:false,permissions:[]}));await loadBuilds().catch(err=>{document.querySelector('#memberBuildList').innerHTML=`<article class="empty-build-card"><h2>Member Builds</h2><p>${esc(err.message)}</p></article>`})}
  document.addEventListener('DOMContentLoaded',mount);
})();
