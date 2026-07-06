
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

  function colorForPath(pid){
    return (DATA.paths[pid] && DATA.paths[pid].accent) || "#8eefff";
  }
  function classIcon(cls){
    return `assets/class-icons/${String(cls||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}.svg`;
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
  function isEligible(skill){ return skill.path === state.path && eligibleClasses().includes(skill.tier); }

  function renderPaths(){
    const grid = $("pathGrid");
    if(!grid) return;
    grid.innerHTML = pathIds.map(pid => {
      const path = DATA.paths[pid];
      const firstClass = path.classes?.[0] || pid;
      return `<article class="path-card ${state.path===pid?"active":""}" style="--accent:${path.accent}">
        <img src="${classIcon(firstClass)}" alt="${escapeHtml(path.name)}">
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
    list = list.filter(s => s.path === state.path);

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
          return `<button type="button" class="skill-card ${state.selectedSkill===s.id?"selected":""} ${eligible?"":"ineligible"}" style="--skillColor:${skillColor(s)}" data-skill-id="${s.id}">
            ${imageTag(s)}
            <strong>${escapeHtml(s.name)}</strong>
            <small>${escapeHtml(s.type)}</small>
          </button>`;
        }).join("")}
      </div>
    </section>`).join("") || `<p class="muted">No skills match these filters.</p>`;

    box.querySelectorAll("[data-skill-id]").forEach(btn => {
      btn.addEventListener("click", () => selectSkill(btn.dataset.skillId));
    });
  }

  function selectSkill(id){
    const s = byId.get(id);
    if(!s) return;
    state.selectedSkill = id;

    const type = s.type === "charm" ? "charm" : "technique";
    if(state.selectedSlot.type === type){
      state[type][state.selectedSlot.index] = id;
    } else {
      const empty = state[type].findIndex(x => !x);
      state[type][empty >= 0 ? empty : 0] = id;
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
    box.innerHTML = `<div class="summary-path">
        <strong>${escapeHtml(p?.name || "No path")}</strong><br>
        <span class="muted">${escapeHtml(currentClass())} • Tier ${state.tierIndex+1}</span>
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

  function stateForSave(){
    return {
      path: state.path,
      tierIndex: state.tierIndex,
      technique: state.technique,
      charm: state.charm,
      selectedSlot: state.selectedSlot
    };
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

  function saveBuild(){
    const name = prompt("Build name:", `${currentPath()?.name || "Unreal"} ${currentClass()}`);
    if(!name) return;
    const saved = JSON.parse(localStorage.getItem("unrealBuildLabV2") || "[]");
    saved.push({ name, date:new Date().toLocaleString(), build:stateForSave() });
    localStorage.setItem("unrealBuildLabV2", JSON.stringify(saved));
    alert("Build saved.");
  }
  function myBuilds(){
    const dialog = $("buildDialog");
    const list = $("savedBuildList");
    const saved = JSON.parse(localStorage.getItem("unrealBuildLabV2") || "[]");
    list.innerHTML = saved.length ? saved.map((b,i)=>`<div class="saved-row"><div><strong>${escapeHtml(b.name)}</strong><br><span class="muted">${escapeHtml(b.date)}</span></div><button type="button" data-load-build="${i}">Load</button></div>`).join("") : `<p class="muted">No saved builds yet.</p>`;
    list.querySelectorAll("[data-load-build]").forEach(btn => btn.addEventListener("click", () => { loadState(saved[Number(btn.dataset.loadBuild)].build); dialog.close(); }));
    dialog.showModal();
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
