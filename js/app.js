const menuButton = document.getElementById("menuButton");
const siteNav = document.getElementById("siteNav");

if (menuButton && siteNav) {
  menuButton.addEventListener("click", () => siteNav.classList.toggle("open"));
  document.querySelectorAll(".site-nav a").forEach((link) => link.addEventListener("click", () => siteNav.classList.remove("open")));
}

function formatCountdown(ms) {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m ${seconds}s`;
}

function nextConquestTime() {
  const now = new Date();
  const options = [
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 13, 0, 0)),
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 20, 0, 0)),
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 13, 0, 0))
  ];
  return options.find((time) => time > now);
}

function nextGuildClashTime() {
  const now = new Date();
  const anchor = new Date(Date.UTC(2026, 0, 1, 20, 0, 0));
  const cycle = 2 * 24 * 60 * 60 * 1000;
  let next = new Date(anchor.getTime());
  while (next <= now) next = new Date(next.getTime() + cycle);
  return next;
}

function updateCountdowns() {
  const now = new Date();
  document.querySelectorAll("#conquestCountdown").forEach((el) => {
    const conquest = nextConquestTime();
    el.textContent = `Next Conquest in ${formatCountdown(conquest - now)}`;
  });
  document.querySelectorAll("#guildClashCountdown").forEach((el) => {
    const clash = nextGuildClashTime();
    el.textContent = `Next cycle in ${formatCountdown(clash - now)}`;
  });
}
updateCountdowns();
setInterval(updateCountdowns, 1000);

/* Build Lab */
const classTrees = {
  "duelist-line": {
    name: "Duelist Line",
    colorName: "Red Path",
    theme: "red",
    icon: "assets/beserker-icon.jpg",
    tiers: ["Warrior", "Duelist", "Berserker", "Conqueror"]
  },
  "knight-line": {
    name: "Knight Line",
    colorName: "Orange Path",
    theme: "orange",
    icon: "assets/paladin-icon.jpg",
    tiers: ["Warrior", "Knight", "Paladin", "Guardian"]
  },
  "sorcerer-line": {
    name: "Sorcerer Line",
    colorName: "Blue Path",
    theme: "blue",
    icon: "assets/archmage-icon.jpg",
    tiers: ["Mage", "Sorcerer", "Archmage", "Destroyer"]
  },
  "sage-line": {
    name: "Sage Line",
    colorName: "Mint Path",
    theme: "mint",
    icon: "assets/arcanist-icon.jpg",
    tiers: ["Mage", "Sage", "Arcanist", "Dominator"]
  }
};

const iconByTier = {
  Warrior: "assets/beserker-icon.jpg",
  Duelist: "assets/beserker-icon.jpg",
  Berserker: "assets/beserker-icon.jpg",
  Conqueror: "assets/beserker-icon.jpg",
  Knight: "assets/paladin-icon.jpg",
  Paladin: "assets/paladin-icon.jpg",
  Guardian: "assets/paladin-icon.jpg",
  Mage: "assets/archmage-icon.jpg",
  Sorcerer: "assets/archmage-icon.jpg",
  Archmage: "assets/archmage-icon.jpg",
  Destroyer: "assets/archmage-icon.jpg",
  Sage: "assets/arcanist-icon.jpg",
  Arcanist: "assets/arcanist-icon.jpg",
  Dominator: "assets/arcanist-icon.jpg"
};

const skills = [
  { id: "boiling-bloodlust", name: "Boiling Bloodlust", type: "technique", tier: "Warrior", icon: "assets/skills/boiling-bloodlust.png", cooldown: "6", description: "Increases the caster's Crit Rate and Crit DMG for 4 turns. (Zero Initial CD)" },
  { id: "blade-tempest", name: "Blade Tempest", type: "charm", tier: "Warrior", icon: iconByTier.Warrior, cooldown: "—", description: "Each time the caster's Technique deals DMG to an enemy, there's a chance to trigger Sword Gale that deals additional Wind DMG once." },
  { id: "blade-of-lament", name: "Blade of Lament", type: "charm", tier: "Warrior", icon: iconByTier.Warrior, cooldown: "—", description: "Each time a Technique deals DMG to an enemy, triggers a Lifesteal effect." },
  { id: "block-awareness", name: "Block Awareness", type: "charm", tier: "Warrior", icon: iconByTier.Warrior, cooldown: "—", description: "Increases the caster's Block Rate." },
  { id: "counter-blade", name: "Counter Blade", type: "charm", tier: "Warrior", icon: iconByTier.Warrior, cooldown: "—", description: "When damaged by an enemy's Technique within 2 grids of the caster, there is a chance to counterattack." },
  { id: "crystal-armor", name: "Crystal Armor", type: "charm", tier: "Warrior", icon: iconByTier.Warrior, cooldown: "—", description: "Increases the caster's DEF." },

  { id: "darkness-descends", name: "Darkness Descends", type: "technique", tier: "Duelist", icon: iconByTier.Duelist, cooldown: "1", description: "Leaps to any empty grid within 5 grids of the caster. Deals Dark DMG once to 1 enemy within 1 grid and randomly dispels 1 buff." },
  { id: "blazing-clash", name: "Blazing Clash", type: "charm", tier: "Duelist", icon: iconByTier.Duelist, cooldown: "—", description: "Increases the caster's DMG dealt for every 4 Techniques used. Stacks up to 3 times." },
  { id: "crit-mastery", name: "Crit Mastery", type: "charm", tier: "Duelist", icon: iconByTier.Duelist, cooldown: "—", description: "Increases the caster's Crit DMG." },

  { id: "eclipse-slash", name: "Eclipse Slash", type: "technique", tier: "Berserker", icon: "assets/skills/eclipse-slash.png", cooldown: "1", description: "Deals Physical DMG 6 times to 1 enemy within 1 grid of the caster. Prioritizes larger targets." },
  { id: "asuras-grasp", name: "Asura's Grasp", type: "technique", tier: "Berserker", icon: iconByTier.Berserker, cooldown: "1", description: "The caster's next damaging Technique deals Doom DMG with a DMG boost." },
  { id: "hunters-judgment", name: "Hunter's Judgment", type: "technique", tier: "Berserker", icon: "assets/skills/hunters-judgment.png", cooldown: "1", description: "Selects a grid, pulls enemies to the target grid, then deals Physical DMG to enemies in front of the caster and knocks them airborne." },
  { id: "sunset-sword", name: "Sunset Sword", type: "technique", tier: "Berserker", icon: "assets/skills/sunset-sword.png", cooldown: "1", description: "Deals Physical DMG 5 times to all enemies in a 3×2 grid area in front of the caster." },
  { id: "blade-siphon", name: "Blade Siphon", type: "charm", tier: "Berserker", icon: "assets/skills/blade-siphon.png", cooldown: "—", description: "Heals the caster once each time the caster's Technique deals Crit DMG to an enemy." },
  { id: "blade-of-judgment", name: "Blade of Judgment", type: "charm", tier: "Berserker", icon: "assets/skills/blade-of-judgment.png", cooldown: "—", description: "Each time the caster's Technique deals DMG, inflicts Mark. At 10 stacks, deals Physical DMG once." },
  { id: "desperate-valor", name: "Desperate Valor", type: "charm", tier: "Berserker", icon: iconByTier.Berserker, cooldown: "—", description: "Increases DMG dealt for every 15% HP lost. Stacks up to 5 times and cannot be dispelled." },
  { id: "indomitable-will", name: "Indomitable Will", type: "charm", tier: "Berserker", icon: "assets/skills/indomitable-will.png", cooldown: "—", description: "Upon taking lethal DMG for the first time, survives with 1 HP, enters Indomitable status, and heals once." },
  { id: "blade-storm", name: "Blade Storm", type: "technique", tier: "Conqueror", icon: iconByTier.Conqueror, cooldown: "1", description: "Deals Wind DMG 3 times to all enemies in a 1×4 grid area in front of the caster." },
  { id: "blazing-momentum", name: "Blazing Momentum", type: "charm", tier: "Conqueror", icon: iconByTier.Conqueror, cooldown: "—", description: "Each time the caster's Technique deals Crit DMG, deals additional Fire DMG once to enemies near the target." },

  { id: "defensive-assault", name: "Defensive Assault", type: "charm", tier: "Knight", icon: iconByTier.Knight, cooldown: "—", description: "Grants an ATK boost when the caster is shielded." },
  { id: "desperate-protection", name: "Desperate Protection", type: "technique", tier: "Paladin", icon: iconByTier.Paladin, cooldown: "2", description: "Grants a shield based on the caster's DEF to the ally with the lowest HP within 3 grids, lasting for 3 turns." },
  { id: "block-mastery", name: "Block Mastery", type: "charm", tier: "Paladin", icon: iconByTier.Paladin, cooldown: "—", description: "Increases the caster's Block Efficiency." },
  { id: "guardian-placeholder-tech", name: "Guardian Technique Slot", type: "technique", tier: "Guardian", icon: iconByTier.Guardian, cooldown: "—", description: "Guardian skill data placeholder. Replace with the exact Prydwen skill entry during the full data import." },
  { id: "guardian-placeholder-charm", name: "Guardian Charm Slot", type: "charm", tier: "Guardian", icon: iconByTier.Guardian, cooldown: "—", description: "Guardian charm data placeholder. Replace with the exact Prydwen skill entry during the full data import." },

  { id: "blazing-fire-ring", name: "Blazing Fire Ring", type: "technique", tier: "Mage", icon: iconByTier.Mage, cooldown: "1", description: "Deals Fire DMG once to all enemies within 2 grids of the caster." },
  { id: "cyclone", name: "Cyclone", type: "technique", tier: "Mage", icon: iconByTier.Mage, cooldown: "1", description: "Selects a grid within 6 grids. Deals Wind DMG once to enemies within 2 grids, knocks them airborne, and pulls them to the target grid." },
  { id: "curse-resonance", name: "Curse Resonance", type: "charm", tier: "Mage", icon: iconByTier.Mage, cooldown: "—", description: "For each ailment or debuff the target carries, Technique DMG dealt by the caster increases. Stacks up to 3 times." },
  { id: "dews-blessing", name: "Dew's Blessing", type: "charm", tier: "Mage", icon: iconByTier.Mage, cooldown: "—", description: "Increases the caster's Water DMG." },
  { id: "sorcerer-placeholder-tech", name: "Sorcerer Technique Slot", type: "technique", tier: "Sorcerer", icon: iconByTier.Sorcerer, cooldown: "—", description: "Sorcerer skill data placeholder. Replace with the exact Prydwen skill entry during the full data import." },
  { id: "aqua-vortex", name: "Aqua Vortex", type: "technique", tier: "Archmage", icon: iconByTier.Archmage, cooldown: "1", description: "Creates a vortex within 4 grids. The vortex deals Water DMG once to enemies within 2 grids and pulls them to its center, with a chance to inflict Wet." },
  { id: "divine-wrath", name: "Divine Wrath", type: "technique", tier: "Archmage", icon: iconByTier.Archmage, cooldown: "—", description: "Archmage Technique. Exact description can be completed during the full Prydwen import." },
  { id: "cyclone-lament", name: "Cyclone Lament", type: "charm", tier: "Destroyer", icon: iconByTier.Destroyer, cooldown: "—", description: "Increases Wind DMG. Wind Technique hits have a chance to inflict Laceration." },

  { id: "dark-bullet", name: "Dark Bullet", type: "technique", tier: "Sage", icon: iconByTier.Sage, cooldown: "—", description: "Attacks 1 enemy within 4 grids, dealing Dark DMG once, with a chance to inflict Erosion." },
  { id: "abyssal-hand", name: "Abyssal Hand", type: "technique", tier: "Arcanist", icon: iconByTier.Arcanist, cooldown: "1", description: "Selects a grid within 3 grids. Deals Dark DMG once to enemies within 2 grids, with a chance to inflict Slow 1 for 2 turns." },
  { id: "chaos-rune", name: "Chaos Rune", type: "technique", tier: "Dominator", icon: iconByTier.Dominator, cooldown: "2", description: "Attacks 1 enemy within 3 grids, dealing Dark DMG once, with a chance to inflict Frenzy for 1 turn." },
  { id: "dark-starburst", name: "Dark Starburst", type: "technique", tier: "Dominator", icon: iconByTier.Dominator, cooldown: "1", description: "Deals Dark DMG 3 times to 1 enemy within 4 grids." },
  { id: "decoy-clone", name: "Decoy Clone", type: "technique", tier: "Dominator", icon: iconByTier.Dominator, cooldown: "3", description: "Summons a Clone in front of the caster and connects it with 1 enemy. When the Clone's HP decreases, the connected target loses an equal amount of HP." },
  { id: "aberrancy", name: "Aberrancy", type: "charm", tier: "Dominator", icon: iconByTier.Dominator, cooldown: "—", description: "When taking DMG, if the attacker is affected by ailment or debuff, reduces DMG taken by the caster." }
];

function initBuildLab() {
  const treePicker = document.getElementById("classTreePicker");
  const tierPicker = document.getElementById("tierPicker");
  const techniqueSlots = document.getElementById("techniqueSlots");
  const charmSlots = document.getElementById("charmSlots");
  if (!treePicker || !tierPicker || !techniqueSlots || !charmSlots) return;

  const buildName = document.getElementById("buildName");
  const title = document.getElementById("currentBuildTitle");
  const savedBuilds = document.getElementById("savedBuilds");
  const saveStatus = document.getElementById("saveStatus");
  let currentTreeId = location.hash?.replace("#", "") || "duelist-line";
  if (!classTrees[currentTreeId]) currentTreeId = "duelist-line";
  let currentTier = classTrees[currentTreeId].tiers[0];
  let activeType = "technique";
  let activeIndex = 0;
  let currentBuild = { name: "", tree: currentTreeId, tier: currentTier, technique: [null, null, null, null], charm: [null, null, null, null] };

  const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const accessTiers = () => classTrees[currentTreeId].tiers.slice(0, classTrees[currentTreeId].tiers.indexOf(currentTier) + 1);
  const available = (type) => skills.filter((skill) => skill.type === type && accessTiers().includes(skill.tier));
  const findSkill = (id) => skills.find((skill) => skill.id === id);

  function setTheme() {
    const tree = classTrees[currentTreeId];
    document.body.classList.remove("theme-red", "theme-orange", "theme-blue", "theme-mint");
    document.body.classList.add(`theme-${tree.theme}`);
    document.getElementById("currentPathLabel").textContent = tree.colorName;
    document.getElementById("currentTierPill").textContent = currentTier;
    document.getElementById("tierPanelTitle").textContent = tree.tiers.join(" → ");
    document.getElementById("libraryTitle").textContent = `${currentTier} Available Skills`;
  }

  function emptySlotMarkup(type, index) {
    const options = available(type).map((item) => `<option value="${item.id}">${item.tier} — ${item.name}</option>`).join("");
    return `<button class="skill-slot empty" data-type="${type}" data-index="${index}" type="button">
      <span class="skill-orb empty-orb">+</span>
      <strong>Choose ${type === "technique" ? "Technique" : "Charm"}</strong>
      <select aria-label="Choose ${type} ${index + 1}"><option value="">Select skill...</option>${options}</select>
    </button>`;
  }

  function slotMarkup(type, id, index) {
    const skill = findSkill(id);
    if (!skill) return emptySlotMarkup(type, index);
    const options = available(type).map((item) => `<option value="${item.id}" ${item.id === id ? "selected" : ""}>${item.tier} — ${item.name}</option>`).join("");
    return `<button class="skill-slot" data-type="${type}" data-index="${index}" type="button">
      <span class="skill-orb"><img src="${skill.icon}" alt="${skill.name}" /></span>
      <strong>${skill.name}</strong>
      <small>${skill.tier}</small>
      <select aria-label="Choose ${type} ${index + 1}"><option value="">Clear slot</option>${options}</select>
    </button>`;
  }

  function showSkill(type, id, index = 0) {
    activeType = type;
    activeIndex = index;
    const skill = findSkill(id);
    const img = document.getElementById("detailIcon");
    const empty = document.getElementById("detailEmptyIcon");
    if (!skill) {
      img.hidden = true; empty.hidden = false;
      document.getElementById("detailName").textContent = "Empty Slot";
      document.getElementById("detailType").textContent = type === "technique" ? "Technique" : "Charm";
      document.getElementById("detailTier").textContent = currentTier;
      document.getElementById("detailDescription").textContent = "Choose a skill from this slot's dropdown.";
      document.getElementById("detailCooldown").textContent = "Cooldown: —";
    } else {
      img.src = skill.icon; img.hidden = false; empty.hidden = true;
      document.getElementById("detailName").textContent = skill.name;
      document.getElementById("detailType").textContent = skill.type === "technique" ? "Technique" : "Charm";
      document.getElementById("detailTier").textContent = skill.tier;
      document.getElementById("detailDescription").textContent = skill.description;
      document.getElementById("detailCooldown").textContent = `Cooldown: ${skill.cooldown}`;
    }
    document.querySelectorAll(".skill-slot").forEach((slot) => slot.classList.remove("active"));
    const activeSlot = document.querySelector(`.skill-slot[data-type='${type}'][data-index='${index}']`);
    if (activeSlot) activeSlot.classList.add("active");
  }

  function renderTreePicker() {
    treePicker.innerHTML = Object.entries(classTrees).map(([id, tree]) => `<button class="class-choice tree-${tree.theme} ${id === currentTreeId ? "active" : ""}" id="${id}" data-tree="${id}" type="button"><img src="${tree.icon}" alt="" /><span>${tree.name}</span><small>${tree.tiers.join(" → ")}</small></button>`).join("");
    treePicker.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
      currentTreeId = button.dataset.tree;
      currentTier = classTrees[currentTreeId].tiers[0];
      currentBuild = { name: buildName.value.trim(), tree: currentTreeId, tier: currentTier, technique: [null, null, null, null], charm: [null, null, null, null] };
      history.replaceState(null, "", `#${currentTreeId}`);
      renderAll();
    }));
  }

  function renderTierPicker() {
    tierPicker.innerHTML = classTrees[currentTreeId].tiers.map((tier, i) => `<button class="tier-choice ${tier === currentTier ? "active" : ""}" data-tier="${tier}" type="button"><span>${i + 1}</span><strong>${tier}</strong><small>${classTrees[currentTreeId].tiers.slice(0, i + 1).join(" + ")}</small></button>`).join("");
    tierPicker.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
      currentTier = button.dataset.tier;
      currentBuild.tier = currentTier;
      currentBuild.technique = currentBuild.technique.map((id) => id && available("technique").some((s) => s.id === id) ? id : null);
      currentBuild.charm = currentBuild.charm.map((id) => id && available("charm").some((s) => s.id === id) ? id : null);
      renderAll();
    }));
  }

  function renderSlots() {
    title.textContent = currentBuild.name || "Unnamed Build";
    buildName.value = currentBuild.name || "";
    techniqueSlots.innerHTML = currentBuild.technique.map((id, i) => slotMarkup("technique", id, i)).join("");
    charmSlots.innerHTML = currentBuild.charm.map((id, i) => slotMarkup("charm", id, i)).join("");
    document.getElementById("techCount").textContent = `${currentBuild.technique.filter(Boolean).length} / 4`;
    document.getElementById("charmCount").textContent = `${currentBuild.charm.filter(Boolean).length} / 4`;

    document.querySelectorAll(".skill-slot").forEach((slot) => {
      const type = slot.dataset.type;
      const index = Number(slot.dataset.index);
      slot.addEventListener("mouseenter", () => showSkill(type, currentBuild[type][index], index));
      slot.addEventListener("click", () => showSkill(type, currentBuild[type][index], index));
      slot.querySelector("select").addEventListener("change", (event) => {
        currentBuild[type][index] = event.target.value || null;
        renderSlots();
        showSkill(type, currentBuild[type][index], index);
      });
    });
    showSkill(activeType, currentBuild[activeType][activeIndex], activeIndex);
  }

  function renderLibrary(type = document.querySelector(".library-tabs button.active")?.dataset.library || "technique") {
    const library = document.getElementById("skillLibrary");
    const list = available(type);
    library.innerHTML = list.length ? list.map((skill) => `<button class="library-skill" type="button" data-id="${skill.id}" data-type="${type}"><img src="${skill.icon}" alt="" /><span><strong>${skill.name}</strong><small>${skill.tier} ${type}</small></span></button>`).join("") : `<p class="empty-library">No ${type}s entered for this tier yet.</p>`;
    library.querySelectorAll(".library-skill").forEach((button) => button.addEventListener("click", () => showSkill(button.dataset.type, button.dataset.id, 0)));
  }

  function saved() { return JSON.parse(localStorage.getItem("unrealSavedBuildsV2") || "[]"); }
  function updateSavedDropdown() {
    const list = saved();
    savedBuilds.innerHTML = list.length ? `<option value="">Load saved build...</option>` + list.map((b, i) => `<option value="${i}">${b.name || "Unnamed"} — ${b.tier}</option>`).join("") : `<option value="">No saved builds yet</option>`;
  }

  function renderAll() {
    setTheme();
    renderTreePicker();
    renderTierPicker();
    renderSlots();
    renderLibrary();
  }

  document.getElementById("saveBuild").addEventListener("click", () => {
    currentBuild.name = buildName.value.trim() || "Unnamed Build";
    currentBuild.tree = currentTreeId;
    currentBuild.tier = currentTier;
    const list = saved();
    const key = `${currentBuild.name.toLowerCase()}|${currentBuild.tree}|${currentBuild.tier}`;
    const existing = list.findIndex((b) => `${(b.name || "").toLowerCase()}|${b.tree}|${b.tier}` === key);
    if (existing >= 0) list[existing] = currentBuild; else list.push(currentBuild);
    localStorage.setItem("unrealSavedBuildsV2", JSON.stringify(list));
    saveStatus.textContent = `Saved: ${currentBuild.name}`;
    updateSavedDropdown();
    renderSlots();
  });

  document.getElementById("deleteBuild").addEventListener("click", () => {
    const index = Number(savedBuilds.value);
    if (Number.isNaN(index)) return;
    const list = saved();
    const removed = list.splice(index, 1)[0];
    localStorage.setItem("unrealSavedBuildsV2", JSON.stringify(list));
    saveStatus.textContent = removed ? `Deleted: ${removed.name}` : "No saved build selected.";
    updateSavedDropdown();
  });

  savedBuilds.addEventListener("change", () => {
    const index = Number(savedBuilds.value);
    if (Number.isNaN(index)) return;
    const build = saved()[index];
    if (!build) return;
    currentBuild = build;
    currentTreeId = build.tree || "duelist-line";
    currentTier = build.tier || classTrees[currentTreeId].tiers[0];
    saveStatus.textContent = `Loaded: ${build.name}`;
    renderAll();
  });

  buildName.addEventListener("input", () => {
    currentBuild.name = buildName.value.trim();
    title.textContent = currentBuild.name || "Unnamed Build";
  });

  document.querySelectorAll(".library-tabs button").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".library-tabs button").forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    renderLibrary(button.dataset.library);
  }));

  updateSavedDropdown();
  renderAll();
}

initBuildLab();
