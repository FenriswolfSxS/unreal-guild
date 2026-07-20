
(function(){
  const raw = document.getElementById("buildLabData");
  const DATA = raw ? JSON.parse(raw.textContent) : { paths:{}, skills:[] };
  const pathIds = Object.keys(DATA.paths);
  const state = {
    path: pathIds[0] || "",
    tierIndex: 0,
    selectedSlot: { type: "technique", index: 0 },
    technique: [null,null,null,null],
    charm: [null,null,null,null],
    selectedSkill: null,
    classFilter: "eligible",
    typeFilter: "all",
    tierFilter: "eligible",
    query: ""
  };

  const $ = (id) => document.getElementById(id);
  const byId = new Map(DATA.skills.map(s => [s.id, s]));

  const BUILD_PAGE_PATHS = {
    duelist: "conqueror",
    knight: "guardian",
    sorcerer: "destroyer",
    sage: "dominator",
    conqueror: "conqueror",
    guardian: "guardian",
    destroyer: "destroyer",
    dominator: "dominator"
  };
  function buildPagePath(){ return BUILD_PAGE_PATHS[state.path] || state.path; }

  function colorForPath(pid){
    return (DATA.paths[pid] && DATA.paths[pid].accent) || "#8eefff";
  }
  function classIcon(cls){
    return `assets/class-icons/${String(cls||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}.svg`;
  }
  function pathIcon(pid){
    const path = DATA.paths[pid];
    return path?.icon || classIcon(path?.name || pid);
  }
  function skillIcon(skill){
    return skill.iconPath || `assets/skills/${skill.id}.png`;
  }
  function imageTag(skill, cls=""){
    const fallback = classIcon(skill.tier);
    return `<img class="${cls}" src="${skillIcon(skill)}" alt="${escapeHtml(skill.name)}" onerror="this.onerror=null;this.src='${fallback}'">`;
  }
  function escapeHtml(str){
    return String(str ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }
  function currentPath(){ return DATA.paths[state.path]; }
  function currentClass(){ return currentPath()?.classes?.[state.tierIndex] || ""; }
  function eligibleClasses(){
    const p = currentPath();
    return p ? p.classes.slice(0, state.tierIndex + 1) : [];
  }
  function skillColor(skill){ return colorForPath(skill.path); }

  // Base-class skills are shared by both specialization branches.
  // Example: Mage skills are stored once under the Sorcerer branch, but they
  // must also be available to Sage / Arcanist / Dominator / Prophet builds.
  // The same rule also keeps Warrior skills available to both melee branches.
  function skillBelongsToPath(skill, pathId = state.path){
    if(skill.path === pathId) return true;

    const selectedPath = DATA.paths[pathId];
    const sourcePath = DATA.paths[skill.path];
    if(!selectedPath || !sourcePath) return false;

    const selectedBaseClass = selectedPath.classes?.[0];
    const sourceBaseClass = sourcePath.classes?.[0];
    return Boolean(
      selectedBaseClass &&
      selectedBaseClass === sourceBaseClass &&
      skill.tier === selectedBaseClass
    );
  }

  function isEligible(skill){
    return skillBelongsToPath(skill) && eligibleClasses().includes(skill.tier);
  }

  function renderPaths(){
    const grid = $("pathGrid");
    if(!grid) return;
    grid.innerHTML = pathIds.map(pid => {
      const path = DATA.paths[pid];
      return `<article class="path-card ${state.path===pid?"active":""}" style="--accent:${path.accent}">
        <img src="${pathIcon(pid)}" alt="${escapeHtml(path.name)}">
        <h3>${escapeHtml(path.name)}</h3>
        <p>${escapeHtml(path.classes.join(" → "))}</p>
        <button type="button" data-path="${pid}">${state.path===pid?"Selected":"Select Path"}</button>
      </article>`;
    }).join("");
    grid.querySelectorAll("[data-path]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.path = btn.dataset.path;
        state.tierIndex = 0;
        state.classFilter = "eligible";
        state.selectedSkill = null;
        clearBuild(false);
        render();
      });
    });
  }

  function renderTiers(){
    const grid = $("tierGrid");
    const p = currentPath();
    if(!grid || !p) return;
    grid.innerHTML = p.classes.map((cls, idx) => `<button type="button" class="tier-card ${idx===state.tierIndex?"active":""}" data-tier-index="${idx}">
      <strong>${idx+1}</strong>
      <span>${escapeHtml(cls)}</span>
      <small>${idx===0?"Base Class":idx===p.classes.length-1?"Advanced Path":"Class Tier"}</small>
    </button>`).join("");
    grid.querySelectorAll("[data-tier-index]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.tierIndex = Number(btn.dataset.tierIndex);
        state.classFilter = "eligible";
        render();
      });
    });
  }

  function renderSlots(){
    const tech = $("techSlots");
    const charm = $("charmSlots");
    if(!tech || !charm) return;
    const slot = (type, id, index) => {
      const s = id ? byId.get(id) : null;
      const active = state.selectedSlot.type === type && state.selectedSlot.index === index;
      return `<div role="button" tabindex="0" class="slot ${type} ${active?"active":""}" data-slot-type="${type}" data-slot-index="${index}">
        ${s ? `${imageTag(s)}<span>${escapeHtml(s.name)}</span><button type="button" class="clear-slot" data-clear-type="${type}" data-clear-index="${index}">×</button>` : `<span>+<br>${type}<br>${index+1}</span>`}
      </div>`;
    };
    tech.innerHTML = state.technique.map((id,i)=>slot("technique", id, i)).join("");
    charm.innerHTML = state.charm.map((id,i)=>slot("charm", id, i)).join("");
    $("techCounter").textContent = `${state.technique.filter(Boolean).length}/4`;
    $("charmCounter").textContent = `${state.charm.filter(Boolean).length}/4`;
    document.querySelectorAll("[data-slot-type]").forEach(btn => {
      btn.addEventListener("click", (ev) => {
        if(ev.target.closest(".clear-slot")) return;
        state.selectedSlot = { type: btn.dataset.slotType, index: Number(btn.dataset.slotIndex) };
        renderSlots();
      });
    });
    document.querySelectorAll("[data-clear-type]").forEach(btn => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        state[btn.dataset.clearType][Number(btn.dataset.clearIndex)] = null;
        render();
      });
    });
  }

  function renderTabs(){
    const tabs = $("classTabs");
    if(!tabs) return;
    const p = currentPath();
    const buttons = [
      `<button type="button" class="${state.classFilter==="eligible"?"active":""}" data-class-filter="eligible">Eligible</button>`,
      `<button type="button" class="${state.classFilter==="all"?"active":""}" data-class-filter="all">All Path</button>`,
      ...(p?.classes || []).map(cls => `<button type="button" class="${state.classFilter===cls?"active":""}" data-class-filter="${escapeHtml(cls)}">${escapeHtml(cls)}</button>`)
    ];
    tabs.innerHTML = buttons.join("");
    tabs.querySelectorAll("[data-class-filter]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.classFilter = btn.dataset.classFilter;
        renderCodex();
      });
    });
  }

  function filteredSkills(){
    let list = DATA.skills.slice();
    list = list.filter(s => skillBelongsToPath(s));

    if(state.classFilter === "eligible") {
      const eligible = new Set(eligibleClasses());
      list = list.filter(s => eligible.has(s.tier));
    } else if(state.classFilter !== "all") {
      list = list.filter(s => s.tier === state.classFilter);
    }

    if(state.typeFilter !== "all") list = list.filter(s => s.type === state.typeFilter);
    if(state.tierFilter === "eligible") {
      const eligible = new Set(eligibleClasses());
      list = list.filter(s => eligible.has(s.tier));
    }

    const q = state.query.trim().toLowerCase();
    if(q) list = list.filter(s => [s.name,s.type,s.tier,s.description,s.cooldown].join(" ").toLowerCase().includes(q));

    // The embedded database contains copied T1 Warrior/Mage rows for both branches.
    // Show one canonical card per ability, regardless of the branch-copy id.
    const unique = new Map();
    for (const skill of list) {
      const key = [skill.tier, skill.type, skill.name].map(v => String(v || '').trim().toLowerCase()).join('|');
      const existing = unique.get(key);
      // Prefer the native row over a generated shared copy so saved ids remain stable.
      if (!existing || (skill.path === state.path && existing.path !== state.path)) unique.set(key, skill);
    }
    list = [...unique.values()];

    const order = currentPath()?.classes || [];
    list.sort((a,b) => (order.indexOf(a.tier)-order.indexOf(b.tier)) || a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    return list;
  }

  function renderCodex(){
    renderTabs();
    const box = $("codexList");
    if(!box) return;
    const list = filteredSkills();
    const classes = currentPath()?.classes || [];
    const grouped = classes.map(cls => [cls, list.filter(s => s.tier === cls)]).filter(x => x[1].length);

    box.innerHTML = grouped.map(([cls, arr]) => `<section class="tier-section">
      <div class="tier-heading"><h3>${escapeHtml(cls)}</h3><span>${arr.length} skills</span></div>
      <div class="skill-grid">
        ${arr.map(s => {
          const eligible = isEligible(s);
          const added = state.technique.includes(s.id) || state.charm.includes(s.id);
          return `<button type="button" class="skill-card ${state.selectedSkill===s.id?"selected":""} ${eligible?"":"ineligible"} ${added?"added":""}" style="--skillColor:${skillColor(s)}" data-skill-id="${s.id}">
            ${added ? `<span class="added-badge">Added</span>` : ""}
            ${imageTag(s)}
            <strong>${escapeHtml(s.name)}</strong>
            <small>${escapeHtml(s.type)}</small>
          </button>`;
        }).join("")}
      </div>
    </section>`).join("") || `<p class="muted">No skills match these filters.</p>`;

    box.querySelectorAll("[data-skill-id]").forEach(btn => {
      btn.addEventListener("mouseenter", () => {
        state.selectedSkill = btn.dataset.skillId;
        renderDetails();
      });
      btn.addEventListener("focus", () => {
        state.selectedSkill = btn.dataset.skillId;
        renderDetails();
      });
      btn.addEventListener("click", () => selectSkill(btn.dataset.skillId));
    });
  }

  function selectSkill(id){
    const s = byId.get(id);
    if(!s) return;
    state.selectedSkill = id;

    const type = s.type === "charm" ? "charm" : "technique";
    const existing = state[type].indexOf(id);

    // Clicking an already-added ability removes it. This also prevents duplicate techniques/charms.
    if(existing >= 0){
      state[type][existing] = null;
      render();
      return;
    }

    // Auto-fill from left to right into the first open matching slot.
    const empty = state[type].findIndex(x => !x);
    if(empty >= 0){
      state[type][empty] = id;
      state.selectedSlot = { type, index: Math.min(empty + 1, 3) };
    } else {
      alert(`${type === "charm" ? "Charms" : "Techniques"} are full. Remove one before adding another.`);
    }
    render();
  }

  function renderDetails(){
    const box = $("detailBox");
    if(!box) return;
    const s = state.selectedSkill ? byId.get(state.selectedSkill) : null;
    if(!s){
      box.className = "empty-detail";
      box.textContent = "Select a skill to view details.";
      return;
    }
    box.className = "detail-card";
    box.innerHTML = `${imageTag(s)}
      <h3>${escapeHtml(s.name)}</h3>
      <div class="tags">
        <span>${escapeHtml(s.type)}</span>
        <span>${escapeHtml(s.tier)}</span>
        <span>${escapeHtml(currentPath()?.name || "")}</span>
        ${isEligible(s) ? "<span>eligible</span>" : "<span>higher tier</span>"}
      </div>
      <p class="muted"><strong>Cooldown:</strong> ${escapeHtml(s.cooldown || "—")}</p>
      <p>${escapeHtml(s.description || "Description pending.")}</p>`;
  }

  function renderSummary(){
    const box = $("summaryBox");
    if(!box) return;
    const p = currentPath();
    const all = [
      ...state.technique.filter(Boolean).map(id=>({slot:"Technique", skill:byId.get(id)})),
      ...state.charm.filter(Boolean).map(id=>({slot:"Charm", skill:byId.get(id)}))
    ].filter(x=>x.skill);
    box.innerHTML = `<div class="summary-path summary-specialization">
        <img src="${pathIcon(state.path)}" alt="${escapeHtml(p?.name || "Specialization")}">
        <div><strong>${escapeHtml(p?.name || "No path")}</strong><br>
        <span class="muted">${escapeHtml(currentClass())} • Tier ${state.tierIndex+1}</span></div>
      </div>
      <div class="summary-list">
      ${all.length ? all.map(x => `<div class="summary-item">${imageTag(x.skill)}<span>${x.slot}: ${escapeHtml(x.skill.name)}</span></div>`).join("") : `<p class="muted">No skills selected yet.</p>`}
      </div>`;
  }

  function renderCounters(){
    const el = $("skillCount");
    if(el) el.textContent = DATA.skills.length;
  }

  function render(){
    renderCounters();
    renderPaths();
    renderTiers();
    renderSlots();
    renderCodex();
    renderDetails();
    renderSummary();
  }

  function buildSnapshot(){
    const p = currentPath();
    const skillRows = [
      ...state.technique.filter(Boolean).map(id => ({ slot: "Technique", skill: byId.get(id) })),
      ...state.charm.filter(Boolean).map(id => ({ slot: "Charm", skill: byId.get(id) }))
    ].filter(x => x.skill).map(x => ({
      slot: x.slot,
      id: x.skill.id,
      name: x.skill.name,
      type: x.skill.type,
      tier: x.skill.tier,
      icon: skillIcon(x.skill),
      fallbackIcon: classIcon(x.skill.tier),
      cooldown: x.skill.cooldown || "—",
      description: x.skill.description || ""
    }));
    return {
      version: 2,
      path: state.path,
      pathName: p?.name || "",
      className: currentClass(),
      tierIndex: state.tierIndex,
      technique: state.technique,
      charm: state.charm,
      selectedSlot: state.selectedSlot,
      skills: skillRows
    };
  }
  function stateForSave(){ return buildSnapshot(); }
  async function apiJson(url, opts){
    const res = await fetch(url, opts);
    const data = await res.json().catch(()=>({}));
    if(!res.ok || data.ok === false) throw new Error(data.error || "Request failed.");
    return data;
  }
  function loadState(saved){
    if(!saved) return;
    state.path = saved.path || state.path;
    state.tierIndex = Number.isInteger(saved.tierIndex) ? saved.tierIndex : state.tierIndex;
    state.technique = Array.isArray(saved.technique) ? saved.technique.slice(0,4).concat([null,null,null,null]).slice(0,4) : [null,null,null,null];
    state.charm = Array.isArray(saved.charm) ? saved.charm.slice(0,4).concat([null,null,null,null]).slice(0,4) : [null,null,null,null];
    state.selectedSlot = saved.selectedSlot || {type:"technique", index:0};
    render();
  }
  function clearBuild(confirmFirst=true){
    if(confirmFirst && !confirm("Clear the current build?")) return;
    state.technique = [null,null,null,null];
    state.charm = [null,null,null,null];
    state.selectedSkill = null;
    render();
  }

  function buildPayload(visibility, title, notes=""){
    const snap = buildSnapshot();
    return {
      path: buildPagePath(),
      class_name: snap.className,
      title,
      tags: [snap.pathName, snap.className].filter(Boolean).join(", "),
      import_code: encodeBuild(),
      notes,
      image_url: "",
      visibility,
      build_json: snap
    };
  }
  async function saveBuild(){
    const name = prompt("Build name for My Builds:", `${currentPath()?.name || "Unreal"} ${currentClass()}`);
    if(!name) return;
    try{
      await apiJson('/api/builds/save',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(buildPayload('private', name))});
      alert("Saved to My Builds.");
    }catch(err){
      alert(err.message || "Could not save build. Make sure you are signed in.");
    }
  }
  async function publishBuild(){
    const name = prompt("Build name to publish:", `${currentPath()?.name || "Unreal"} ${currentClass()} Build`);
    if(!name) return;
    const notes = prompt("Build description for the class build page:", "") || "";
    try{
      const d = await apiJson('/api/builds/save',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(buildPayload('public', name, notes))});
      alert("Published to the matching class build page.");
      const page = `${buildPagePath()}-builds.html`;
      if(confirm("Open the class build page now?")) location.href = page;
    }catch(err){
      alert(err.message || "Could not publish build. Make sure you are signed in.");
    }
  }
  async function myBuilds(){
    const dialog = $("buildDialog");
    const list = $("savedBuildList");
    list.innerHTML = `<p class="muted">Loading your D1 saved builds...</p>`;
    dialog.showModal();
    try{
      const d = await apiJson('/api/builds/list?mine=1&_='+Date.now(), { cache:'no-store' });
      const saved = d.builds || [];
      list.innerHTML = saved.length ? saved.map((b,i)=>`<div class="saved-row"><div><strong>${escapeHtml(b.title)}</strong><br><span class="muted">${escapeHtml(b.path || 'build')} • ${escapeHtml(b.visibility || 'private')} • ${escapeHtml(b.updated_at || b.created_at || '')}</span></div><button type="button" data-load-build="${i}">Load</button></div>`).join("") : `<p class="muted">No saved builds yet.</p>`;
      list.querySelectorAll("[data-load-build]").forEach(btn => btn.addEventListener("click", () => {
        const b = saved[Number(btn.dataset.loadBuild)];
        try{ loadState(JSON.parse(b.build_json || '{}')); dialog.close(); }
        catch(e){ alert('This saved build could not be loaded.'); }
      }));
    }catch(err){
      list.innerHTML = `<p class="muted">${escapeHtml(err.message || 'Could not load My Builds.')}</p>`;
    }
  }
  function encodeBuild(){ return btoa(unescape(encodeURIComponent(JSON.stringify(stateForSave())))); }
  function decodeBuild(code){ return JSON.parse(decodeURIComponent(escape(atob(code)))); }
  function exportBuild(){
    const code = encodeBuild();
    navigator.clipboard?.writeText(code);
    prompt("Build code copied if your browser allowed it:", code);
  }
  function importBuild(){
    let code = prompt("Paste build code or share URL:");
    if(!code) return;
    try{
      if(code.includes("#build=")) code = code.split("#build=")[1];
      loadState(decodeBuild(code.trim()));
    }catch(e){ alert("That build code could not be imported."); }
  }
  function shareBuild(){
    const url = `${location.origin}${location.pathname}#build=${encodeBuild()}`;
    navigator.clipboard?.writeText(url);
    prompt("Share URL copied if your browser allowed it:", url);
  }
  function loadHash(){
    const m = location.hash.match(/build=([^&]+)/);
    if(!m) return;
    try{ loadState(decodeBuild(m[1])); }catch(e){}
  }

  function bind(){
    $("menuToggle")?.addEventListener("click", () => $("forgeNav")?.classList.toggle("open"));
    $("searchInput")?.addEventListener("input", e => { state.query = e.target.value; renderCodex(); });
    $("typeFilter")?.addEventListener("change", e => { state.typeFilter = e.target.value; renderCodex(); });
    $("tierFilter")?.addEventListener("change", e => { state.tierFilter = e.target.value; renderCodex(); });
    $("resetFiltersBtn")?.addEventListener("click", () => {
      state.query = ""; state.typeFilter = "all"; state.tierFilter = "eligible"; state.classFilter = "eligible";
      $("searchInput").value = ""; $("typeFilter").value = "all"; $("tierFilter").value = "eligible"; renderCodex();
    });
    $("saveBuildBtn")?.addEventListener("click", saveBuild);
    $("publishBuildBtn")?.addEventListener("click", publishBuild);
    $("myBuildsBtn")?.addEventListener("click", myBuilds);
    $("exportBuildBtn")?.addEventListener("click", exportBuild);
    $("importBuildBtn")?.addEventListener("click", importBuild);
    $("shareBuildBtn")?.addEventListener("click", shareBuild);
    $("clearBuildBtn")?.addEventListener("click", () => clearBuild(true));
  }

  document.addEventListener("DOMContentLoaded", () => {
    bind();
    render();
    loadHash();
  });
})();
