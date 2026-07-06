
const data = window.UNREAL_BUILD_DATA;
const state = {
  path: null,
  tier: 1,
  selectedSlot: { kind: "Technique", index: 0 },
  tech: [null, null, null, null],
  charms: [null, null, null, null],
  filterKind: "All",
  selectedSkill: null
};

const $ = (id) => document.getElementById(id);
const byId = Object.fromEntries(data.skills.map(s => [s.id, s]));

function iconForPath(id){ return `assets/build-lab-icons/path-${id}.svg`; }

function renderPaths(){
  $("pathGrid").innerHTML = data.paths.map(path => `
    <article class="path-card ${state.path === path.id ? "selected" : ""}" style="--accent:${path.accent};--accent-soft:${path.accent}33">
      <img src="${iconForPath(path.id)}" alt="${path.name}">
      <h3>${path.name}</h3>
      <p>${path.steps.join(" → ")}</p>
      <button data-path="${path.id}">${state.path === path.id ? "Selected" : "Select Path"}</button>
    </article>
  `).join("");

  document.querySelectorAll("[data-path]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.path = btn.dataset.path;
      state.tech = [null,null,null,null];
      state.charms = [null,null,null,null];
      state.selectedSkill = null;
      render();
    });
  });
}

function renderTiers(){
  $("tierRow").innerHTML = [1,2,3,4].map(t => `
    <button class="tier-card ${state.tier === t ? "selected" : ""}" data-tier="${t}">
      <strong>${t}</strong>
      <span><b>Tier ${t}</b><br><small>${["Base","Advanced","Master","Ultimate"][t-1]}</small></span>
    </button>
  `).join("");

  document.querySelectorAll("[data-tier]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.tier = Number(btn.dataset.tier);
      render();
    });
  });
}

function renderSlots(){
  const slotHtml = (skillId, i, kind) => {
    const skill = skillId ? byId[skillId] : null;
    const cls = kind === "Charm" ? "skill-slot charm" : "skill-slot";
    const selected = state.selectedSlot.kind === kind && state.selectedSlot.index === i ? "selected" : "";
    return `<button class="${cls} ${selected}" data-slot-kind="${kind}" data-slot-index="${i}">
      <small>${i+1}</small>
      ${skill ? `<img src="${skill.icon}" title="${skill.name}" alt="${skill.name}">` : "+"}
    </button>`;
  };

  $("techSlots").innerHTML = state.tech.map((s,i)=>slotHtml(s,i,"Technique")).join("");
  $("charmSlots").innerHTML = state.charms.map((s,i)=>slotHtml(s,i,"Charm")).join("");
  $("techCount").textContent = `(${state.tech.filter(Boolean).length}/4)`;
  $("charmCount").textContent = `(${state.charms.filter(Boolean).length}/4)`;

  document.querySelectorAll("[data-slot-kind]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.selectedSlot = { kind: btn.dataset.slotKind, index: Number(btn.dataset.slotIndex) };
      renderSlots();
    });
  });
}

function renderPassives(){
  $("passiveRow").innerHTML = data.passives.map(p => `<div class="passive" title="${p.name}">${p.icon}</div>`).join("");
}

function visibleSkills(){
  let list = data.skills.filter(s => !state.path || s.path === state.path);
  list = list.filter(s => s.tier <= state.tier);
  if (state.filterKind !== "All") list = list.filter(s => s.kind === state.filterKind);
  const tierFilter = $("tierFilter")?.value || "All";
  if (tierFilter !== "All") list = list.filter(s => String(s.tier) === tierFilter);
  const typeFilter = $("typeFilter")?.value || "All";
  if (typeFilter !== "All") list = list.filter(s => s.type === typeFilter);
  const q = ($("skillSearch")?.value || "").trim().toLowerCase();
  if (q) list = list.filter(s => [s.name,s.className,s.kind,s.type,s.description].join(" ").toLowerCase().includes(q));
  return list;
}

function renderSkillList(){
  const path = data.paths.find(p => p.id === state.path);
  $("pathLabel").textContent = path ? `${path.steps.join(" → ")} • ${visibleSkills().length} skills available` : "Choose a path to view skills.";

  const list = visibleSkills();
  const grouped = [1,2,3,4].map(t => [t, list.filter(s => s.tier === t)]).filter(([t, arr]) => arr.length);
  $("skillList").innerHTML = grouped.map(([tier, arr]) => `
    <section class="tier-group">
      <h3>Tier ${tier} - ${path ? path.steps[tier-1] : "Any"} <small>${arr.length} skills</small></h3>
      <div class="skill-grid">
        ${arr.map(s => `<button class="skill-card" data-skill="${s.id}">
          <img src="${s.icon}" alt="${s.name}">
          <span>${s.name}</span>
        </button>`).join("")}
      </div>
    </section>
  `).join("") || `<p class="slot-help">No skills match your filters.</p>`;

  document.querySelectorAll("[data-skill]").forEach(btn => {
    btn.addEventListener("click", () => selectSkill(btn.dataset.skill));
  });
}

function selectSkill(id){
  const skill = byId[id];
  state.selectedSkill = id;

  if (skill.kind === state.selectedSlot.kind) {
    const arr = skill.kind === "Technique" ? state.tech : state.charms;
    arr[state.selectedSlot.index] = id;
  } else {
    const arr = skill.kind === "Technique" ? state.tech : state.charms;
    const empty = arr.findIndex(x => !x);
    if (empty >= 0) arr[empty] = id;
  }
  render();
}

function renderDetails(){
  const el = $("skillDetails");
  const skill = state.selectedSkill ? byId[state.selectedSkill] : null;
  if (!skill) {
    el.className = "skill-details empty";
    el.textContent = "Select a skill to view details.";
    return;
  }
  el.className = "skill-details";
  el.innerHTML = `
    <div class="detail-top">
      <img src="${skill.icon}" alt="${skill.name}">
      <div><h3>${skill.name}</h3><div class="tag-row"><span>${skill.kind}</span><span>${skill.type}</span></div></div>
    </div>
    <div class="detail-table">
      <span>Tier</span><strong>${skill.tier} - ${skill.className}</strong>
      <span>Cooldown</span><strong>${skill.cooldown}</strong>
      <span>Resource</span><strong>${skill.resource}</strong>
      <span>Distance</span><strong>${skill.distance}</strong>
      <span>Target</span><strong>${skill.target}</strong>
    </div>
    <p>${skill.description}</p>
    <div class="tag-row"><span>${skill.pathName}</span><span>${skill.kind}</span><span>${skill.type}</span></div>
  `;
}

function renderSummary(){
  const path = data.paths.find(p => p.id === state.path);
  const assigned = [...state.tech, ...state.charms].filter(Boolean).map(id => byId[id]);
  $("buildSummary").innerHTML = `
    <p>${path ? `<strong>${path.name}</strong><br>${path.steps[state.tier-1]} • Tier ${state.tier}` : "No class path selected yet."}</p>
    <div class="summary-list">
      ${assigned.map(s => `<div class="summary-item"><img src="${s.icon}" alt=""><span>${s.kind}: ${s.name}</span></div>`).join("") || "<p>Select a class path and assign skills to get started.</p>"}
    </div>
    <p>Techniques Assigned: <strong>${state.tech.filter(Boolean).length}/4</strong></p>
    <p>Charms Assigned: <strong>${state.charms.filter(Boolean).length}/4</strong></p>
  `;
}

function renderProgress(){
  const path = data.paths.find(p => p.id === state.path);
  $("progressList").innerHTML = [1,2,3,4].map(t => `
    <div class="progress-step ${state.tier >= t ? "active" : ""}">
      <span>${t}</span>
      <div><strong>Tier ${t}</strong><br><small>${path ? path.steps[t-1] : ["Base","Advanced","Master","Ultimate"][t-1]}</small></div>
    </div>
  `).join("");
}

function saveBuild(){
  const name = prompt("Build name:", `${data.paths.find(p=>p.id===state.path)?.name || "Unreal"} Tier ${state.tier}`);
  if (!name) return;
  const builds = JSON.parse(localStorage.getItem("unrealBuilds") || "[]");
  builds.push({ name, date: new Date().toLocaleString(), state: JSON.parse(JSON.stringify(state)) });
  localStorage.setItem("unrealBuilds", JSON.stringify(builds));
  alert("Build saved.");
}

function showBuilds(){
  const builds = JSON.parse(localStorage.getItem("unrealBuilds") || "[]");
  $("savedBuilds").innerHTML = builds.map((b,i)=>`
    <div class="saved-row">
      <div><strong>${b.name}</strong><br><small>${b.date}</small></div>
      <button data-load="${i}">Load</button>
    </div>`).join("") || "<p>No saved builds yet.</p>";
  $("savedDialog").showModal();
  document.querySelectorAll("[data-load]").forEach(btn => btn.addEventListener("click", () => {
    Object.assign(state, builds[Number(btn.dataset.load)].state);
    $("savedDialog").close();
    render();
  }));
}

function exportBuild(){
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  navigator.clipboard?.writeText(encoded);
  prompt("Copy this build code:", encoded);
}

function importBuild(){
  const code = prompt("Paste build code:");
  if (!code) return;
  try {
    const imported = JSON.parse(decodeURIComponent(escape(atob(code))));
    Object.assign(state, imported);
    render();
  } catch(e) { alert("Invalid build code."); }
}

function shareBuild(){
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  const url = `${location.origin}${location.pathname}#build=${encoded}`;
  navigator.clipboard?.writeText(url);
  prompt("Copy share URL:", url);
}

function clearAll(){
  if (!confirm("Clear the current build?")) return;
  state.tech = [null,null,null,null];
  state.charms = [null,null,null,null];
  state.selectedSkill = null;
  render();
}

function loadFromHash(){
  const match = location.hash.match(/build=([^&]+)/);
  if (match) {
    try { Object.assign(state, JSON.parse(decodeURIComponent(escape(atob(match[1]))))); } catch(e) {}
  }
}

function render(){
  renderPaths(); renderTiers(); renderSlots(); renderPassives(); renderSkillList(); renderDetails(); renderSummary(); renderProgress();
}

document.querySelectorAll(".chip").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".chip").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  state.filterKind = btn.dataset.kind;
  renderSkillList();
}));

["skillSearch","tierFilter","typeFilter"].forEach(id => $(id).addEventListener("input", renderSkillList));
$("saveBtn").addEventListener("click", saveBuild);
$("myBuildsBtn").addEventListener("click", showBuilds);
$("exportBtn").addEventListener("click", exportBuild);
$("importBtn").addEventListener("click", importBuild);
$("shareBtn").addEventListener("click", shareBuild);
$("clearBtn").addEventListener("click", clearAll);

loadFromHash();
render();
