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
    tiers: ["Warrior", "Duelist", "Berserker", "Conqueror", "Ravager"]
  },
  "knight-line": {
    name: "Knight Line",
    colorName: "Orange Path",
    theme: "orange",
    icon: "assets/paladin-icon.jpg",
    tiers: ["Warrior", "Knight", "Paladin", "Guardian", "Templar"]
  },
  "sorcerer-line": {
    name: "Sorcerer Line",
    colorName: "Blue Path",
    theme: "blue",
    icon: "assets/archmage-icon.jpg",
    tiers: ["Mage", "Sorcerer", "Archmage", "Destroyer", "Magister"]
  },
  "sage-line": {
    name: "Sage Line",
    colorName: "Mint Path",
    theme: "mint",
    icon: "assets/arcanist-icon.jpg",
    tiers: ["Mage", "Sage", "Arcanist", "Dominator", "Prophet"]
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
  Dominator: "assets/arcanist-icon.jpg",
  Ravager: "assets/beserker-icon.jpg",
  Templar: "assets/paladin-icon.jpg",
  Magister: "assets/archmage-icon.jpg",
  Prophet: "assets/arcanist-icon.jpg"
};

const skills = [
  { id: 'warrior-boiling-bloodlust', name: 'Boiling Bloodlust', type: 'technique', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '6', description: "Increases the caster's Crit Rate and Crit DMG for 4 turns. (Zero Initial CD)" },
  { id: 'warrior-diving-gale', name: 'Diving Gale', type: 'technique', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: 'Selects a grid within 4 grids of the caster. Deals Wind DMG once to all enemies within 1 grid of the target grid.' },
  { id: 'warrior-edge-strike', name: 'Edge Strike', type: 'technique', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: 'Deals Physical DMG once to 1 enemy within 1 grid of the caster.' },
  { id: 'warrior-gravity-pull', name: 'Gravity Pull', type: 'technique', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: 'Selects a grid within 7 grids of the caster. Deals Wind DMG once to enemies near the target grid and pulls them to the caster.' },
  { id: 'warrior-heavy-impact', name: 'Heavy Impact', type: 'technique', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '2', description: 'Attacks 1 enemy within 1 grid, dealing Physical DMG once and knocking them airborne.' },
  { id: 'warrior-leap-attack', name: 'Leap Attack', type: 'technique', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '1', description: 'Leaps to an empty space within 3 grids, deals Physical DMG to nearby enemies, and can inflict Armor Break 2.' },
  { id: 'warrior-lion-combo', name: 'Lion Combo', type: 'technique', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: 'Deals Physical DMG 3 times to 1 enemy within 1 grid of the caster.' },
  { id: 'warrior-luminous-shield', name: 'Luminous Shield', type: 'technique', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '5', description: 'Increases Block Rate and Block Efficiency for 3 turns. (Zero Initial CD)' },
  { id: 'warrior-mountain-collapse', name: 'Mountain Collapse', type: 'technique', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '1', description: 'Deals Physical DMG once to all enemies within 2 grids, knocking them airborne and possibly knocking them back.' },
  { id: 'warrior-phantom-assault', name: 'Phantom Assault', type: 'technique', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: 'Phantom Assault (Warrior Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'warrior-quadrant-slash', name: 'Quadrant Slash', type: 'technique', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '1', description: 'Deals Physical DMG once to all enemies within 1 grid of the caster.' },
  { id: 'warrior-whirlwind-slash', name: 'Whirlwind Slash', type: 'technique', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '1', description: 'Deals Physical DMG 4 times to all enemies within a 1-grid square area of the caster.' },
  { id: 'warrior-wind-blade-slash', name: 'Wind Blade Slash', type: 'technique', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '1', description: 'Deals Wind DMG once to all enemies in a 1×4 grid area and can knock them back.' },
  { id: 'warrior-blade-tempest', name: 'Blade Tempest', type: 'charm', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: 'Blade Tempest (Warrior Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'warrior-blade-of-lament', name: 'Blade of Lament', type: 'charm', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: 'Blade of Lament (Warrior Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'warrior-block-awareness', name: 'Block Awareness', type: 'charm', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: 'Block Awareness (Warrior Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'warrior-counter-blade', name: 'Counter Blade', type: 'charm', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: 'Counter Blade (Warrior Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'warrior-crystal-armor', name: 'Crystal Armor', type: 'charm', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: 'Crystal Armor (Warrior Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'warrior-feline-dance', name: 'Feline Dance', type: 'charm', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: 'Feline Dance (Warrior Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'warrior-insightful-eye', name: 'Insightful Eye', type: 'charm', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: 'Insightful Eye (Warrior Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'warrior-iron-fortress', name: 'Iron Fortress', type: 'charm', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: 'Iron Fortress (Warrior Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'warrior-life-blessing', name: 'Life Blessing', type: 'charm', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: 'Life Blessing (Warrior Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'warrior-pure-protection', name: 'Pure Protection', type: 'charm', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: 'Pure Protection (Warrior Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'warrior-relentless-frenzy', name: 'Relentless Frenzy', type: 'charm', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: 'Relentless Frenzy (Warrior Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'warrior-strength-rules', name: 'Strength Rules', type: 'charm', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: 'Strength Rules (Warrior Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'warrior-warrior-s-essence', name: "Warrior's Essence", type: 'charm', tier: 'Warrior', icon: iconByTier.Warrior, cooldown: '—', description: "Warrior's Essence (Warrior Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import." },
  { id: 'duelist-darkness-descends', name: 'Darkness Descends', type: 'technique', tier: 'Duelist', icon: iconByTier.Duelist, cooldown: '1', description: 'Leaps to an empty grid within 5 grids, deals Dark DMG, and randomly dispels 1 buff.' },
  { id: 'duelist-fire-slash', name: 'Fire Slash', type: 'technique', tier: 'Duelist', icon: iconByTier.Duelist, cooldown: '—', description: 'Deals Fire Doom DMG once to all enemies in a 3×2 grid area in front of the caster.' },
  { id: 'duelist-flame-aura', name: 'Flame Aura', type: 'technique', tier: 'Duelist', icon: iconByTier.Duelist, cooldown: '1', description: 'Grants Flame to the caster and 3 random allies within 3 grids for 2 turns.' },
  { id: 'duelist-flash-dash', name: 'Flash Dash', type: 'technique', tier: 'Duelist', icon: iconByTier.Duelist, cooldown: '—', description: 'Dashes 5 grids in a straight line, dealing Physical Doom DMG to enemies along the path.' },
  { id: 'duelist-shattering-sigil', name: 'Shattering Sigil', type: 'technique', tier: 'Duelist', icon: iconByTier.Duelist, cooldown: '1', description: 'Attacks 1 enemy within 1 grid, dealing Fire DMG and inflicting Sigil.' },
  { id: 'duelist-sunset-sword', name: 'Sunset Sword', type: 'technique', tier: 'Duelist', icon: iconByTier.Duelist, cooldown: '1', description: 'Deals Physical DMG 5 times to all enemies in a 3×2 grid area in front of the caster.' },
  { id: 'duelist-blazing-clash', name: 'Blazing Clash', type: 'charm', tier: 'Duelist', icon: iconByTier.Duelist, cooldown: '—', description: 'Blazing Clash (Duelist Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'duelist-crit-mastery', name: 'Crit Mastery', type: 'charm', tier: 'Duelist', icon: iconByTier.Duelist, cooldown: '—', description: 'Crit Mastery (Duelist Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'duelist-frame-of-battles', name: 'Frame of Battles', type: 'charm', tier: 'Duelist', icon: iconByTier.Duelist, cooldown: '—', description: 'Frame of Battles (Duelist Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'duelist-indomitable-will', name: 'Indomitable Will', type: 'charm', tier: 'Duelist', icon: iconByTier.Duelist, cooldown: '—', description: 'Indomitable Will (Duelist Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'duelist-potential-vitality', name: 'Potential Vitality', type: 'charm', tier: 'Duelist', icon: iconByTier.Duelist, cooldown: '—', description: 'Potential Vitality (Duelist Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'berserker-asura-s-grasp', name: "Asura's Grasp", type: 'technique', tier: 'Berserker', icon: iconByTier.Berserker, cooldown: '1', description: "The caster's next damaging Technique deals Doom DMG with a DMG boost." },
  { id: 'berserker-doom-blade', name: 'Doom Blade', type: 'technique', tier: 'Berserker', icon: iconByTier.Berserker, cooldown: '1', description: 'Leaps to an empty space within 5 grids and deals Dark DMG to nearby enemies, knocking them airborne and potentially inflicting Armor Break.' },
  { id: 'berserker-eclipse-slash', name: 'Eclipse Slash', type: 'technique', tier: 'Berserker', icon: iconByTier.Berserker, cooldown: '1', description: 'Deals Physical DMG 6 times to 1 enemy within 1 grid of the caster.' },
  { id: 'berserker-gale-dance', name: 'Gale Dance', type: 'technique', tier: 'Berserker', icon: iconByTier.Berserker, cooldown: '1', description: 'Increases Movement and SPD for allied characters within 3 grids for 2 turns. (Casts once before battle starts.)' },
  { id: 'berserker-hunter-s-judgment', name: "Hunter's Judgment", type: 'technique', tier: 'Berserker', icon: iconByTier.Berserker, cooldown: '1', description: 'Pulls enemies to the grid in front of the caster, then deals Physical DMG 3 times in a 3×3 area and knocks them airborne.' },
  { id: 'berserker-blade-siphon', name: 'Blade Siphon', type: 'charm', tier: 'Berserker', icon: iconByTier.Berserker, cooldown: '—', description: 'Blade Siphon (Berserker Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'berserker-blade-of-judgment', name: 'Blade of Judgment', type: 'charm', tier: 'Berserker', icon: iconByTier.Berserker, cooldown: '—', description: 'Blade of Judgment (Berserker Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'berserker-desperate-valor', name: 'Desperate Valor', type: 'charm', tier: 'Berserker', icon: iconByTier.Berserker, cooldown: '—', description: 'Desperate Valor (Berserker Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'berserker-soul-splash', name: 'Soul Splash', type: 'charm', tier: 'Berserker', icon: iconByTier.Berserker, cooldown: '—', description: 'Soul Splash (Berserker Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'berserker-soulfire-protection', name: 'Soulfire Protection', type: 'charm', tier: 'Berserker', icon: iconByTier.Berserker, cooldown: '—', description: 'Soulfire Protection (Berserker Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'conqueror-blade-storm', name: 'Blade Storm', type: 'technique', tier: 'Conqueror', icon: iconByTier.Conqueror, cooldown: '1', description: 'Deals Wind DMG 3 times to all enemies in a 1×4 grid area in front of the caster.' },
  { id: 'conqueror-dreadful-shadow', name: 'Dreadful Shadow', type: 'technique', tier: 'Conqueror', icon: iconByTier.Conqueror, cooldown: '1', description: 'Attacks all enemies within 2 grids, dealing Dark DMG once and can inflict Fear.' },
  { id: 'conqueror-flash-fire', name: 'Flash Fire', type: 'technique', tier: 'Conqueror', icon: iconByTier.Conqueror, cooldown: '1', description: 'Leaps to an empty grid adjacent to an enemy 2 grids away and deals Fire DMG. (Zero Initial CD)' },
  { id: 'conqueror-flickering-blade', name: 'Flickering Blade', type: 'technique', tier: 'Conqueror', icon: iconByTier.Conqueror, cooldown: '—', description: 'Deals Fire DMG to 1 adjacent enemy and can cast again up to 2 additional times.' },
  { id: 'conqueror-hellfire-requiem', name: 'Hellfire Requiem', type: 'technique', tier: 'Conqueror', icon: iconByTier.Conqueror, cooldown: '1', description: 'At the start of each turn for 2 turns, heals the caster and dispels 2 random ailments or debuffs.' },
  { id: 'conqueror-soul-piercer', name: 'Soul Piercer', type: 'technique', tier: 'Conqueror', icon: iconByTier.Conqueror, cooldown: '1', description: 'Deals Dark DMG once to all enemies in a 3×2 grid area with Lifesteal.' },
  { id: 'conqueror-blazing-momentum', name: 'Blazing Momentum', type: 'charm', tier: 'Conqueror', icon: iconByTier.Conqueror, cooldown: '—', description: 'Blazing Momentum (Conqueror Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'conqueror-piercing-assault', name: 'Piercing Assault', type: 'charm', tier: 'Conqueror', icon: iconByTier.Conqueror, cooldown: '—', description: 'Piercing Assault (Conqueror Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'conqueror-sharp-feathers', name: 'Sharp Feathers', type: 'charm', tier: 'Conqueror', icon: iconByTier.Conqueror, cooldown: '—', description: 'Sharp Feathers (Conqueror Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'conqueror-soul-breaker', name: 'Soul Breaker', type: 'charm', tier: 'Conqueror', icon: iconByTier.Conqueror, cooldown: '—', description: 'Soul Breaker (Conqueror Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'conqueror-spirit-in-fire', name: 'Spirit in Fire', type: 'charm', tier: 'Conqueror', icon: iconByTier.Conqueror, cooldown: '—', description: 'Spirit in Fire (Conqueror Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'conqueror-tactical-adaptation', name: 'Tactical Adaptation', type: 'charm', tier: 'Conqueror', icon: iconByTier.Conqueror, cooldown: '—', description: 'Tactical Adaptation (Conqueror Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'knight-frostbite-blossom', name: 'Frostbite Blossom', type: 'technique', tier: 'Knight', icon: iconByTier.Knight, cooldown: '1', description: 'Frostbite Blossom (Knight Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'knight-guardian-ring', name: 'Guardian Ring', type: 'technique', tier: 'Knight', icon: iconByTier.Knight, cooldown: '1', description: 'Guardian Ring (Knight Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'knight-heart-of-challenge', name: 'Heart of Challenge', type: 'technique', tier: 'Knight', icon: iconByTier.Knight, cooldown: '1', description: 'Heart of Challenge (Knight Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'knight-ricocheting-shield', name: 'Ricocheting Shield', type: 'technique', tier: 'Knight', icon: iconByTier.Knight, cooldown: '1', description: 'Ricocheting Shield (Knight Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'knight-stunning-strike', name: 'Stunning Strike', type: 'technique', tier: 'Knight', icon: iconByTier.Knight, cooldown: '1', description: 'Stunning Strike (Knight Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'knight-valor-surge', name: 'Valor Surge', type: 'technique', tier: 'Knight', icon: iconByTier.Knight, cooldown: '1', description: 'Valor Surge (Knight Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'knight-defensive-assault', name: 'Defensive Assault', type: 'charm', tier: 'Knight', icon: iconByTier.Knight, cooldown: '—', description: 'Defensive Assault (Knight Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'knight-eye-for-an-eye', name: 'Eye for an Eye', type: 'charm', tier: 'Knight', icon: iconByTier.Knight, cooldown: '—', description: 'Eye for an Eye (Knight Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'knight-pursuit-of-victory', name: 'Pursuit of Victory', type: 'charm', tier: 'Knight', icon: iconByTier.Knight, cooldown: '—', description: 'Pursuit of Victory (Knight Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'knight-rebound', name: 'Rebound', type: 'charm', tier: 'Knight', icon: iconByTier.Knight, cooldown: '—', description: 'Rebound (Knight Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'knight-ripple-impact', name: 'Ripple Impact', type: 'charm', tier: 'Knight', icon: iconByTier.Knight, cooldown: '—', description: 'Ripple Impact (Knight Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'paladin-desperate-protection', name: 'Desperate Protection', type: 'technique', tier: 'Paladin', icon: iconByTier.Paladin, cooldown: '2', description: 'Desperate Protection (Paladin Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'paladin-forceful-charge', name: 'Forceful Charge', type: 'technique', tier: 'Paladin', icon: iconByTier.Paladin, cooldown: '2', description: 'Forceful Charge (Paladin Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'paladin-holy-purification', name: 'Holy Purification', type: 'technique', tier: 'Paladin', icon: iconByTier.Paladin, cooldown: '1', description: 'Holy Purification (Paladin Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'paladin-lunarwater-threads', name: 'Lunarwater Threads', type: 'technique', tier: 'Paladin', icon: iconByTier.Paladin, cooldown: '1', description: 'Lunarwater Threads (Paladin Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'paladin-star-shattering-slash', name: 'Star Shattering Slash', type: 'technique', tier: 'Paladin', icon: iconByTier.Paladin, cooldown: '3', description: 'Star Shattering Slash (Paladin Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'paladin-block-mastery', name: 'Block Mastery', type: 'charm', tier: 'Paladin', icon: iconByTier.Paladin, cooldown: '—', description: 'Block Mastery (Paladin Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'paladin-potential-rebirth', name: 'Potential Rebirth', type: 'charm', tier: 'Paladin', icon: iconByTier.Paladin, cooldown: '—', description: 'Potential Rebirth (Paladin Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'paladin-reflective-armor', name: 'Reflective Armor', type: 'charm', tier: 'Paladin', icon: iconByTier.Paladin, cooldown: '—', description: 'Reflective Armor (Paladin Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'paladin-source-of-vitality', name: 'Source of Vitality', type: 'charm', tier: 'Paladin', icon: iconByTier.Paladin, cooldown: '—', description: 'Source of Vitality (Paladin Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'paladin-stone-skin', name: 'Stone Skin', type: 'charm', tier: 'Paladin', icon: iconByTier.Paladin, cooldown: '—', description: 'Stone Skin (Paladin Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'guardian-hamper-strike', name: 'Hamper Strike', type: 'technique', tier: 'Guardian', icon: iconByTier.Guardian, cooldown: '1', description: 'Hamper Strike (Guardian Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'guardian-light-sword-array', name: 'Light Sword Array', type: 'technique', tier: 'Guardian', icon: iconByTier.Guardian, cooldown: '1', description: 'Light Sword Array (Guardian Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'guardian-phantom-blade', name: 'Phantom Blade', type: 'technique', tier: 'Guardian', icon: iconByTier.Guardian, cooldown: '1', description: 'Phantom Blade (Guardian Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'guardian-raging-maelstrom', name: 'Raging Maelstrom', type: 'technique', tier: 'Guardian', icon: iconByTier.Guardian, cooldown: '1', description: 'Raging Maelstrom (Guardian Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'guardian-seismic-tide', name: 'Seismic Tide', type: 'technique', tier: 'Guardian', icon: iconByTier.Guardian, cooldown: '—', description: 'Seismic Tide (Guardian Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'guardian-swirling-blade', name: 'Swirling Blade', type: 'technique', tier: 'Guardian', icon: iconByTier.Guardian, cooldown: '1', description: 'Swirling Blade (Guardian Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'guardian-frigid-aura', name: 'Frigid Aura', type: 'charm', tier: 'Guardian', icon: iconByTier.Guardian, cooldown: '—', description: 'Frigid Aura (Guardian Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'guardian-frigid-glint', name: 'Frigid Glint', type: 'charm', tier: 'Guardian', icon: iconByTier.Guardian, cooldown: '—', description: 'Frigid Glint (Guardian Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'guardian-holy-aegis', name: 'Holy Aegis', type: 'charm', tier: 'Guardian', icon: iconByTier.Guardian, cooldown: '—', description: 'Holy Aegis (Guardian Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'guardian-iron-will', name: 'Iron Will', type: 'charm', tier: 'Guardian', icon: iconByTier.Guardian, cooldown: '—', description: 'Iron Will (Guardian Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'guardian-oath-of-vigil', name: 'Oath of Vigil', type: 'charm', tier: 'Guardian', icon: iconByTier.Guardian, cooldown: '—', description: 'Oath of Vigil (Guardian Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'guardian-soul-protection', name: 'Soul Protection', type: 'charm', tier: 'Guardian', icon: iconByTier.Guardian, cooldown: '—', description: 'Soul Protection (Guardian Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-blazing-fire-ring', name: 'Blazing Fire Ring', type: 'technique', tier: 'Mage', icon: iconByTier.Mage, cooldown: '1', description: 'Blazing Fire Ring (Mage Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-cyclone', name: 'Cyclone', type: 'technique', tier: 'Mage', icon: iconByTier.Mage, cooldown: '1', description: 'Cyclone (Mage Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-fireball', name: 'Fireball', type: 'technique', tier: 'Mage', icon: iconByTier.Mage, cooldown: '1', description: 'Fireball (Mage Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-flame-jet', name: 'Flame Jet', type: 'technique', tier: 'Mage', icon: iconByTier.Mage, cooldown: '1', description: 'Flame Jet (Mage Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-healing-touch', name: 'Healing Touch', type: 'technique', tier: 'Mage', icon: iconByTier.Mage, cooldown: '1', description: 'Healing Touch (Mage Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-ice-spike', name: 'Ice Spike', type: 'technique', tier: 'Mage', icon: iconByTier.Mage, cooldown: '1', description: 'Ice Spike (Mage Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-iron-thorn', name: 'Iron Thorn', type: 'technique', tier: 'Mage', icon: iconByTier.Mage, cooldown: '1', description: 'Iron Thorn (Mage Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-stonechief-summon', name: 'Stonechief Summon', type: 'technique', tier: 'Mage', icon: iconByTier.Mage, cooldown: '5', description: 'Stonechief Summon (Mage Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-tempest-sphere', name: 'Tempest Sphere', type: 'technique', tier: 'Mage', icon: iconByTier.Mage, cooldown: '1', description: 'Tempest Sphere (Mage Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-void-blessing', name: 'Void Blessing', type: 'technique', tier: 'Mage', icon: iconByTier.Mage, cooldown: '2', description: 'Void Blessing (Mage Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-water-assault', name: 'Water Assault', type: 'technique', tier: 'Mage', icon: iconByTier.Mage, cooldown: '1', description: 'Water Assault (Mage Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-water-shot', name: 'Water Shot', type: 'technique', tier: 'Mage', icon: iconByTier.Mage, cooldown: '—', description: 'Water Shot (Mage Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-wind-s-delight', name: "Wind's Delight", type: 'technique', tier: 'Mage', icon: iconByTier.Mage, cooldown: '1', description: "Wind's Delight (Mage Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import." },
  { id: 'mage-curse-resonance', name: 'Curse Resonance', type: 'charm', tier: 'Mage', icon: iconByTier.Mage, cooldown: '—', description: 'Curse Resonance (Mage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-dew-s-blessing', name: "Dew's Blessing", type: 'charm', tier: 'Mage', icon: iconByTier.Mage, cooldown: '—', description: "Dew's Blessing (Mage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import." },
  { id: 'mage-elemental-body', name: 'Elemental Body', type: 'charm', tier: 'Mage', icon: iconByTier.Mage, cooldown: '—', description: 'Elemental Body (Mage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-elemental-mystery', name: 'Elemental Mystery', type: 'charm', tier: 'Mage', icon: iconByTier.Mage, cooldown: '—', description: 'Elemental Mystery (Mage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-flaming-path', name: 'Flaming Path', type: 'charm', tier: 'Mage', icon: iconByTier.Mage, cooldown: '—', description: 'Flaming Path (Mage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-gale-shield', name: 'Gale Shield', type: 'charm', tier: 'Mage', icon: iconByTier.Mage, cooldown: '—', description: 'Gale Shield (Mage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-heart-of-flame', name: 'Heart of Flame', type: 'charm', tier: 'Mage', icon: iconByTier.Mage, cooldown: '—', description: 'Heart of Flame (Mage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-insight', name: 'Insight', type: 'charm', tier: 'Mage', icon: iconByTier.Mage, cooldown: '—', description: 'Insight (Mage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-mana-surge', name: 'Mana Surge', type: 'charm', tier: 'Mage', icon: iconByTier.Mage, cooldown: '—', description: 'Mana Surge (Mage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-tough-soul', name: 'Tough Soul', type: 'charm', tier: 'Mage', icon: iconByTier.Mage, cooldown: '—', description: 'Tough Soul (Mage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-unstable-aura', name: 'Unstable Aura', type: 'charm', tier: 'Mage', icon: iconByTier.Mage, cooldown: '—', description: 'Unstable Aura (Mage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-water-to-ice', name: 'Water to Ice', type: 'charm', tier: 'Mage', icon: iconByTier.Mage, cooldown: '—', description: 'Water to Ice (Mage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'mage-wind-s-whisper', name: "Wind's Whisper", type: 'charm', tier: 'Mage', icon: iconByTier.Mage, cooldown: '—', description: "Wind's Whisper (Mage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import." },
  { id: 'sorcerer-energy-burst', name: 'Energy Burst', type: 'technique', tier: 'Sorcerer', icon: iconByTier.Sorcerer, cooldown: '1', description: 'Energy Burst (Sorcerer Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'sorcerer-fiery-star-trail', name: 'Fiery Star Trail', type: 'technique', tier: 'Sorcerer', icon: iconByTier.Sorcerer, cooldown: '1', description: 'Fiery Star Trail (Sorcerer Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'sorcerer-flickering-stars', name: 'Flickering Stars', type: 'technique', tier: 'Sorcerer', icon: iconByTier.Sorcerer, cooldown: '1', description: 'Flickering Stars (Sorcerer Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'sorcerer-frosty-nova', name: 'Frosty Nova', type: 'technique', tier: 'Sorcerer', icon: iconByTier.Sorcerer, cooldown: '1', description: 'Frosty Nova (Sorcerer Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'sorcerer-light-of-dawn', name: 'Light of Dawn', type: 'technique', tier: 'Sorcerer', icon: iconByTier.Sorcerer, cooldown: '1', description: 'Light of Dawn (Sorcerer Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'sorcerer-lightning-chain', name: 'Lightning Chain', type: 'technique', tier: 'Sorcerer', icon: iconByTier.Sorcerer, cooldown: '—', description: 'Lightning Chain (Sorcerer Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'sorcerer-elemental-harmony', name: 'Elemental Harmony', type: 'charm', tier: 'Sorcerer', icon: iconByTier.Sorcerer, cooldown: '—', description: 'Elemental Harmony (Sorcerer Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'sorcerer-lightning-mystery', name: 'Lightning Mystery', type: 'charm', tier: 'Sorcerer', icon: iconByTier.Sorcerer, cooldown: '—', description: 'Lightning Mystery (Sorcerer Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'sorcerer-raging-wildfire', name: 'Raging Wildfire', type: 'charm', tier: 'Sorcerer', icon: iconByTier.Sorcerer, cooldown: '—', description: 'Raging Wildfire (Sorcerer Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'sorcerer-void-bubble', name: 'Void Bubble', type: 'charm', tier: 'Sorcerer', icon: iconByTier.Sorcerer, cooldown: '—', description: 'Void Bubble (Sorcerer Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'sorcerer-wind-s-shadow', name: "Wind's Shadow", type: 'charm', tier: 'Sorcerer', icon: iconByTier.Sorcerer, cooldown: '—', description: "Wind's Shadow (Sorcerer Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import." },
  { id: 'archmage-aqua-vortex', name: 'Aqua Vortex', type: 'technique', tier: 'Archmage', icon: iconByTier.Archmage, cooldown: '1', description: 'Creates a vortex that deals Water DMG to enemies within 2 grids and pulls them to its center, with a chance to inflict Wet.' },
  { id: 'archmage-divine-wrath', name: 'Divine Wrath', type: 'technique', tier: 'Archmage', icon: iconByTier.Archmage, cooldown: '2', description: 'Randomly deals Light DMG 16 times within 3 grids of the target.' },
  { id: 'archmage-fire-blast', name: 'Fire Blast', type: 'technique', tier: 'Archmage', icon: iconByTier.Archmage, cooldown: '—', description: 'Fire Blast (Archmage Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'archmage-howling-hurricane', name: 'Howling Hurricane', type: 'technique', tier: 'Archmage', icon: iconByTier.Archmage, cooldown: '2', description: 'Deals Wind DMG 5 times to enemies within 2 grids of the target grid, knocking them airborne.' },
  { id: 'archmage-meteoric-flames', name: 'Meteoric Flames', type: 'technique', tier: 'Archmage', icon: iconByTier.Archmage, cooldown: '1', description: 'Deals Fire DMG to enemies near a target grid and can inflict Burn on grids within range.' },
  { id: 'archmage-frost-guard', name: 'Frost Guard', type: 'charm', tier: 'Archmage', icon: iconByTier.Archmage, cooldown: '—', description: 'Frost Guard (Archmage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'archmage-incarnation-of-light', name: 'Incarnation of Light', type: 'charm', tier: 'Archmage', icon: iconByTier.Archmage, cooldown: '—', description: 'Incarnation of Light (Archmage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'archmage-radiant-sear', name: 'Radiant Sear', type: 'charm', tier: 'Archmage', icon: iconByTier.Archmage, cooldown: '—', description: 'Radiant Sear (Archmage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'archmage-rapid-cast', name: 'Rapid Cast', type: 'charm', tier: 'Archmage', icon: iconByTier.Archmage, cooldown: '—', description: 'Rapid Cast (Archmage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'archmage-repelling-wind', name: 'Repelling Wind', type: 'charm', tier: 'Archmage', icon: iconByTier.Archmage, cooldown: '—', description: 'Repelling Wind (Archmage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'destroyer-flowing-doom', name: 'Flowing Doom', type: 'technique', tier: 'Destroyer', icon: iconByTier.Destroyer, cooldown: '2', description: 'Flowing Doom (Destroyer Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'destroyer-formation-breaker', name: 'Formation Breaker', type: 'technique', tier: 'Destroyer', icon: iconByTier.Destroyer, cooldown: '2', description: 'Formation Breaker (Destroyer Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'destroyer-protective-rune', name: 'Protective Rune', type: 'technique', tier: 'Destroyer', icon: iconByTier.Destroyer, cooldown: '4', description: 'Protective Rune (Destroyer Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'destroyer-starlight-burst', name: 'Starlight Burst', type: 'technique', tier: 'Destroyer', icon: iconByTier.Destroyer, cooldown: '1', description: 'Starlight Burst (Destroyer Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'destroyer-thunder-of-judgment', name: 'Thunder of Judgment', type: 'technique', tier: 'Destroyer', icon: iconByTier.Destroyer, cooldown: '1', description: 'Thunder of Judgment (Destroyer Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'destroyer-wind-blade-spiral', name: 'Wind Blade Spiral', type: 'technique', tier: 'Destroyer', icon: iconByTier.Destroyer, cooldown: '1', description: 'Wind Blade Spiral (Destroyer Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'destroyer-cyclone-lament', name: 'Cyclone Lament', type: 'charm', tier: 'Destroyer', icon: iconByTier.Destroyer, cooldown: '—', description: 'Cyclone Lament (Destroyer Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'destroyer-explosive-spirit', name: 'Explosive Spirit', type: 'charm', tier: 'Destroyer', icon: iconByTier.Destroyer, cooldown: '—', description: 'Explosive Spirit (Destroyer Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'destroyer-fiery-burst', name: 'Fiery Burst', type: 'charm', tier: 'Destroyer', icon: iconByTier.Destroyer, cooldown: '—', description: 'Fiery Burst (Destroyer Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'destroyer-fiery-rejuvenation', name: 'Fiery Rejuvenation', type: 'charm', tier: 'Destroyer', icon: iconByTier.Destroyer, cooldown: '—', description: 'Fiery Rejuvenation (Destroyer Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'destroyer-overload-protection', name: 'Overload Protection', type: 'charm', tier: 'Destroyer', icon: iconByTier.Destroyer, cooldown: '—', description: 'Overload Protection (Destroyer Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'destroyer-shattering-ice', name: 'Shattering Ice', type: 'charm', tier: 'Destroyer', icon: iconByTier.Destroyer, cooldown: '—', description: 'Shattering Ice (Destroyer Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'sage-dark-bullet', name: 'Dark Bullet', type: 'technique', tier: 'Sage', icon: iconByTier.Sage, cooldown: '—', description: 'Attacks 1 enemy within 4 grids with Dark DMG and can inflict Erosion.' },
  { id: 'sage-flame-wolf-summon', name: 'Flame Wolf Summon', type: 'technique', tier: 'Sage', icon: iconByTier.Sage, cooldown: '2', description: 'Flame Wolf Summon (Sage Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'sage-radiant-restoration', name: 'Radiant Restoration', type: 'technique', tier: 'Sage', icon: iconByTier.Sage, cooldown: '2', description: 'Heals all allies within 4 grids of the caster once.' },
  { id: 'sage-shadow-impact', name: 'Shadow Impact', type: 'technique', tier: 'Sage', icon: iconByTier.Sage, cooldown: '1', description: 'Deals Dark DMG to enemies near a target grid. If the target carries Erosion, triggers Erosion twice immediately.' },
  { id: 'sage-treantling-summon', name: 'Treantling Summon', type: 'technique', tier: 'Sage', icon: iconByTier.Sage, cooldown: '3', description: 'Treantling Summon (Sage Technique) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'sage-weakening-hex', name: 'Weakening Hex', type: 'technique', tier: 'Sage', icon: iconByTier.Sage, cooldown: '1', description: 'Deals Dark DMG to enemies near a target grid with a chance to inflict Weakened.' },
  { id: 'sage-healing-mastery', name: 'Healing Mastery', type: 'charm', tier: 'Sage', icon: iconByTier.Sage, cooldown: '—', description: 'Healing Mastery (Sage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'sage-resurrection', name: 'Resurrection', type: 'charm', tier: 'Sage', icon: iconByTier.Sage, cooldown: '—', description: 'Resurrection (Sage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'sage-shadow-erosion', name: 'Shadow Erosion', type: 'charm', tier: 'Sage', icon: iconByTier.Sage, cooldown: '—', description: 'Shadow Erosion (Sage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'sage-soul-impact', name: 'Soul Impact', type: 'charm', tier: 'Sage', icon: iconByTier.Sage, cooldown: '—', description: 'Soul Impact (Sage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'sage-soul-spark', name: 'Soul Spark', type: 'charm', tier: 'Sage', icon: iconByTier.Sage, cooldown: '—', description: 'Soul Spark (Sage Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'arcanist-abyssal-hand', name: 'Abyssal Hand', type: 'technique', tier: 'Arcanist', icon: iconByTier.Arcanist, cooldown: '1', description: 'Deals Dark DMG to enemies within 2 grids of a selected grid, with a chance to inflict Slow.' },
  { id: 'arcanist-frenzy-totem', name: 'Frenzy Totem', type: 'technique', tier: 'Arcanist', icon: iconByTier.Arcanist, cooldown: '4', description: 'Summons a Totem in front of the caster that immediately acts and remains up to 5 turns.' },
  { id: 'arcanist-mana-blast', name: 'Mana Blast', type: 'technique', tier: 'Arcanist', icon: iconByTier.Arcanist, cooldown: '1', description: 'Deals Dark DMG to enemies within 2 grids of a selected grid with a chance to inflict Erosion.' },
  { id: 'arcanist-shadow-of-termination', name: 'Shadow of Termination', type: 'technique', tier: 'Arcanist', icon: iconByTier.Arcanist, cooldown: '2', description: 'Deals Dark DMG to 1 enemy and triggers all Erosion stacks if the target carries Erosion.' },
  { id: 'arcanist-waterling-summon', name: 'Waterling Summon', type: 'technique', tier: 'Arcanist', icon: iconByTier.Arcanist, cooldown: '3', description: 'Summons a Waterling behind the caster that immediately acts and remains up to 5 turns.' },
  { id: 'arcanist-linked-misfortune', name: 'Linked Misfortune', type: 'charm', tier: 'Arcanist', icon: iconByTier.Arcanist, cooldown: '—', description: 'Linked Misfortune (Arcanist Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'arcanist-night-s-blessing', name: "Night's Blessing", type: 'charm', tier: 'Arcanist', icon: iconByTier.Arcanist, cooldown: '—', description: "Night's Blessing (Arcanist Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import." },
  { id: 'arcanist-overhealing', name: 'Overhealing', type: 'charm', tier: 'Arcanist', icon: iconByTier.Arcanist, cooldown: '—', description: 'Overhealing (Arcanist Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'arcanist-shadow-vengeance', name: 'Shadow Vengeance', type: 'charm', tier: 'Arcanist', icon: iconByTier.Arcanist, cooldown: '—', description: 'Shadow Vengeance (Arcanist Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'arcanist-summoner-s-frenzy', name: "Summoner's Frenzy", type: 'charm', tier: 'Arcanist', icon: iconByTier.Arcanist, cooldown: '—', description: "Summoner's Frenzy (Arcanist Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import." },
  { id: 'dominator-chaos-rune', name: 'Chaos Rune', type: 'technique', tier: 'Dominator', icon: iconByTier.Dominator, cooldown: '2', description: 'Attacks 1 enemy within 3 grids with Dark DMG and can inflict Frenzy.' },
  { id: 'dominator-dark-starburst', name: 'Dark Starburst', type: 'technique', tier: 'Dominator', icon: iconByTier.Dominator, cooldown: '1', description: 'Deals Dark DMG 3 times to 1 enemy within 4 grids.' },
  { id: 'dominator-decoy-clone', name: 'Decoy Clone', type: 'technique', tier: 'Dominator', icon: iconByTier.Dominator, cooldown: '3', description: 'Summons a Clone connected to 1 enemy. When the Clone loses HP, the connected target loses equal HP.' },
  { id: 'dominator-rejuvenating-rain', name: 'Rejuvenating Rain', type: 'technique', tier: 'Dominator', icon: iconByTier.Dominator, cooldown: '—', description: 'Heals 1 ally within 5 grids; healing is increased if target HP is below 50%.' },
  { id: 'dominator-rock-rex-summon', name: 'Rock Rex Summon', type: 'technique', tier: 'Dominator', icon: iconByTier.Dominator, cooldown: '—', description: 'Summons 1 Rock Rex in front of the caster. Can only trigger once per battle.' },
  { id: 'dominator-spirit-aegis', name: 'Spirit Aegis', type: 'technique', tier: 'Dominator', icon: iconByTier.Dominator, cooldown: '1', description: 'Grants Spirit Mark to the allied character with the lowest HP within 5 grids.' },
  { id: 'dominator-aberrancy', name: 'Aberrancy', type: 'charm', tier: 'Dominator', icon: iconByTier.Dominator, cooldown: '—', description: 'Aberrancy (Dominator Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'dominator-falling-dark-star', name: 'Falling Dark Star', type: 'charm', tier: 'Dominator', icon: iconByTier.Dominator, cooldown: '—', description: 'Falling Dark Star (Dominator Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'dominator-mantra-of-blessings', name: 'Mantra of Blessings', type: 'charm', tier: 'Dominator', icon: iconByTier.Dominator, cooldown: '—', description: 'Mantra of Blessings (Dominator Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'dominator-phantom-light', name: 'Phantom Light', type: 'charm', tier: 'Dominator', icon: iconByTier.Dominator, cooldown: '—', description: 'Phantom Light (Dominator Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'dominator-soul-pact-resonance', name: 'Soul Pact Resonance', type: 'charm', tier: 'Dominator', icon: iconByTier.Dominator, cooldown: '—', description: 'Soul Pact Resonance (Dominator Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
  { id: 'dominator-soulbond-restoration', name: 'Soulbond Restoration', type: 'charm', tier: 'Dominator', icon: iconByTier.Dominator, cooldown: '—', description: 'Soulbond Restoration (Dominator Charm) from Prydwen skill data. Full detailed text can be refined as we continue the import.' },
,
  { id: 'ravager-air-break', name: 'Air Break', type: 'technique', tier: 'Ravager', icon: iconByTier.Ravager, cooldown: '1', description: 'Attacks 1 enemy within 1 grid of the caster, dealing Physical Doom DMG once, with an 80% base chance to inflict Armor Break 2 for 2 turns. (Prioritizes large targets)' },
  { id: 'ravager-glacial-song', name: 'Glacial Song', type: 'technique', tier: 'Ravager', icon: iconByTier.Ravager, cooldown: '—', description: 'Selects a grid within 4 grids of the caster. Deals Wind DMG once to all enemies within 2 grids of the target grid, with a 30% base chance to inflict Slow 2 for 2 turns.' },
  { id: 'ravager-night-curse', name: 'Night Curse', type: 'technique', tier: 'Ravager', icon: iconByTier.Ravager, cooldown: '1', description: 'Attacks all enemies within 2 grids of the caster, dealing Dark DMG once, with an 80% base chance to inflict Blood Source for 1 turn.' },
  { id: 'ravager-shadow-end', name: 'Shadow End', type: 'technique', tier: 'Ravager', icon: iconByTier.Ravager, cooldown: '2', description: 'Teleports to an empty grid adjacent to 1 enemy within 5 grids of the caster. Deals Dark DMG once to the target. Killing the target triggers this skill again. Can be cast up to 4 additional times per turn.' },
  { id: 'ravager-shattering-dance', name: 'Shattering Dance', type: 'technique', tier: 'Ravager', icon: iconByTier.Ravager, cooldown: '—', description: 'Attacks 1 enemy within 1 grid of the caster, dealing Physical DMG 3 times, with a 60% base chance to inflict 1 stack of Riven Heart for 1 turn. Stacks up to 3 times. (Prioritizes large targets)' },
  { id: 'ravager-solaris-storm', name: 'Solaris Storm', type: 'technique', tier: 'Ravager', icon: iconByTier.Ravager, cooldown: '1', description: 'Deals Fire DMG 3 times to all enemies within a 1-grid square area around the caster, then deals Fire DMG once to all enemies within a 2-grid circular area around the caster. (Zero Initial CD)' },
  { id: 'ravager-dominant-gaze', name: 'Dominant Gaze', type: 'charm', tier: 'Ravager', icon: iconByTier.Ravager, cooldown: '—', description: 'Deals increased Technique DMG to targets above 70% HP.' },
  { id: 'ravager-flaming-heel', name: 'Flaming Heel', type: 'charm', tier: 'Ravager', icon: iconByTier.Ravager, cooldown: '—', description: 'After actively moving, deals Fire DMG once to all enemies within 1 grid of the caster.' },
  { id: 'ravager-scarlet-zeal', name: 'Scarlet Zeal', type: 'charm', tier: 'Ravager', icon: iconByTier.Ravager, cooldown: '—', description: 'Each Technique cast grants a stack of Battle Zeal and increases the caster\'s ATK. At 6 stacks, Battle Zeal converts to Scarlet Zeal, greatly increasing the caster\'s ATK for 2 turns. Battle Zeal doesn\'t stack while Scarlet Zeal is active.' },
  { id: 'ravager-shadowstep', name: 'Shadowstep', type: 'charm', tier: 'Ravager', icon: iconByTier.Ravager, cooldown: '—', description: 'Within a single turn, each time the caster loses over 10% of max HP, reduces DMG taken and increases SPD for 2 turns. Stacks up to 5 times.' },
  { id: 'ravager-tempest-edge', name: 'Tempest Edge', type: 'charm', tier: 'Ravager', icon: iconByTier.Ravager, cooldown: '—', description: 'Each time the caster\'s Technique deals Crit DMG to an enemy, causes additional Wind DMG once.' },
  { id: 'ravager-zephyr-battle-zeal', name: 'Zephyr Battle Zeal', type: 'charm', tier: 'Ravager', icon: iconByTier.Ravager, cooldown: '—', description: 'Ravager charm listed in the extended database. Detailed tooltip still needs verification against the live database.' },
  { id: 'templar-dawnburst', name: 'Dawnburst', type: 'technique', tier: 'Templar', icon: iconByTier.Templar, cooldown: '1', description: 'Deals Light DMG once to all enemies within 3 grids of the caster. Large targets may take multiple hits.' },
  { id: 'templar-first-light', name: 'First Light', type: 'technique', tier: 'Templar', icon: iconByTier.Templar, cooldown: '—', description: 'Removes all shields to select a grid within 4 grids of the caster and deals Light DMG once to all enemies within a 1-grid square area around the target grid. The DMG dealt is a percentage of the shields consumed.' },
  { id: 'templar-iron-slashes', name: 'Iron Slashes', type: 'technique', tier: 'Templar', icon: iconByTier.Templar, cooldown: '1', description: 'Deals Physical DMG twice to 1 enemy within 1 grid of the caster. (Prioritizes large targets)' },
  { id: 'templar-last-stand', name: 'Last Stand', type: 'technique', tier: 'Templar', icon: iconByTier.Templar, cooldown: '—', description: 'Moves to any empty space within 4 grids of the caster, dealing Physical DMG once to 1 enemy within 1 grid of the caster, with an 85% base chance to inflict Taunt for 1 turn. Increases the chance to Taunt non-character units by 100%. (Prioritizes large targets.)' },
  { id: 'templar-sacred-shine', name: 'Sacred Shine', type: 'technique', tier: 'Templar', icon: iconByTier.Templar, cooldown: '—', description: 'Selects a grid within 3 grids of the caster. Deals Light DMG once to all enemies within a 1-grid square area of the target grid.' },
  { id: 'templar-sanctified-soul', name: 'Sanctified Soul', type: 'technique', tier: 'Templar', icon: iconByTier.Templar, cooldown: '2', description: 'Enters the Sanctification state for 2 turns, reducing DMG taken by the caster and all allied characters within 4 grids of the caster. The effect is unique and cannot be dispelled. (Zero Initial CD)' },
  { id: 'templar-healing-shift', name: 'Healing Shift', type: 'charm', tier: 'Templar', icon: iconByTier.Templar, cooldown: '—', description: 'Increases healing received. Instead of restoring HP, all healing is converted at a 1:1 ratio into a shield for 2 turns. When the shield disappears, any remaining shield strength is converted 1:1 back into HP.' },
  { id: 'templar-holy-bulwark', name: 'Holy Bulwark', type: 'charm', tier: 'Templar', icon: iconByTier.Templar, cooldown: '—', description: 'Counterattack skills deal more DMG.' },
  { id: 'templar-holy-recuperation', name: 'Holy Recuperation', type: 'charm', tier: 'Templar', icon: iconByTier.Templar, cooldown: '—', description: 'At the end of the caster\'s turn, if no Techniques were cast this turn, heals the caster once and increases DMG dealt next turn by 50%.' },
  { id: 'templar-holy-restoration', name: 'Holy Restoration', type: 'charm', tier: 'Templar', icon: iconByTier.Templar, cooldown: '—', description: 'Casting each Light Technique has a 70% chance to gain 1 stack of Renewing Light. At 6 stacks of Renewing Light, heals the caster once.' },
  { id: 'templar-sacred-rhythm', name: 'Sacred Rhythm', type: 'charm', tier: 'Templar', icon: iconByTier.Templar, cooldown: '—', description: 'From the caster\'s 3rd turn onward, increases DMG dealt at the start of each turn. Stacks up to 3 times.' },
  { id: 'templar-twin-radiance-shield', name: 'Twin Radiance Shield', type: 'charm', tier: 'Templar', icon: iconByTier.Templar, cooldown: '—', description: 'Templar charm listed in the extended database. Detailed tooltip still needs verification against the live database.' },
  { id: 'magister-blast-spirit', name: 'Blast Spirit', type: 'technique', tier: 'Magister', icon: iconByTier.Magister, cooldown: '2', description: 'Places 2 Blast Spirits in front of the caster. They remain on the battlefield for up to 3 turns. (Zero Initial CD)' },
  { id: 'magister-crimson-whirl', name: 'Crimson Whirl', type: 'technique', tier: 'Magister', icon: iconByTier.Magister, cooldown: '2', description: 'Deals Fire Doom DMG 3 times to all enemies in a 3×3 grid area in front of the caster.' },
  { id: 'magister-frost-thorn', name: 'Frost Thorn', type: 'technique', tier: 'Magister', icon: iconByTier.Magister, cooldown: '1', description: 'Deals Water DMG twice to all enemies in a 3×3 grid area in front of the caster, with a 30% base chance to inflict Frozen for 1 turn.' },
  { id: 'magister-light-burst', name: 'Light Burst', type: 'technique', tier: 'Magister', icon: iconByTier.Magister, cooldown: '1', description: 'Deals Light DMG once to 1 enemy within 4 grids of the caster. Each instance of damage can chain to 2 random enemies within 4 grids of the target, up to 2 times. Each enemy can only be hit once by the same chain.' },
  { id: 'magister-storm-rhapsody', name: 'Storm Rhapsody', type: 'technique', tier: 'Magister', icon: iconByTier.Magister, cooldown: '1', description: 'Selects a grid within 5 grids of the caster. Deals Wind DMG 3 times to all enemies within 3 grids of the target grid with a 35% base chance to knock them back by 1 grid towards the center of the battlefield.' },
  { id: 'magister-twin-gale', name: 'Twin Gale', type: 'technique', tier: 'Magister', icon: iconByTier.Magister, cooldown: '—', description: 'Deals Wind DMG twice to 1 enemy within 3 to 5 grids of the caster.' },
  { id: 'magister-ember-flare', name: 'Ember Flare', type: 'charm', tier: 'Magister', icon: iconByTier.Magister, cooldown: '—', description: 'Increases the caster\'s Fire DMG. Killing an enemy has a 30% chance to place 1 Blast Spirit on the spot.' },
  { id: 'magister-frostsoul-ward', name: 'Frostsoul Ward', type: 'charm', tier: 'Magister', icon: iconByTier.Magister, cooldown: '—', description: 'Increases the caster\'s Water DMG. When attacked, there\'s a 70% base chance to inflict Wet on the attacker for 2 turns.' },
  { id: 'magister-thunder-judgment', name: 'Thunder Judgment', type: 'charm', tier: 'Magister', icon: iconByTier.Magister, cooldown: '—', description: 'When an enemy within 5 grids of the caster casts a Technique, there\'s a 30% chance to trigger Thunder Strike, dealing Light DMG once. The chance increases to 90% if the target is inflicted with Electro or Wet.' },
  { id: 'magister-thunderbolt-mark', name: 'Thunderbolt Mark', type: 'charm', tier: 'Magister', icon: iconByTier.Magister, cooldown: '—', description: 'Each time the caster\'s Technique deals Light DMG to an enemy, there is a 65% base chance to inflict Electro.' },
  { id: 'magister-vital-rhythm', name: 'Vital Rhythm', type: 'charm', tier: 'Magister', icon: iconByTier.Magister, cooldown: '—', description: 'At the start of the caster\'s turn, gains 1 stack of Rhythm if the caster\'s HP is above 30%. This effect stacks up to 5 times and cannot be dispelled.' },
  { id: 'magister-judgment-thunder', name: 'Judgment Thunder', type: 'charm', tier: 'Magister', icon: iconByTier.Magister, cooldown: '—', description: 'Magister charm listed in the extended database. Detailed tooltip still needs verification against the live database.' },
  { id: 'prophet-desperate-shadow', name: 'Desperate Shadow', type: 'technique', tier: 'Prophet', icon: iconByTier.Prophet, cooldown: '1', description: 'Deals Dark DMG once to all enemies within a 1×4 grid area in front of the caster, with a 70% base chance to inflict 1 random debuff for 2 turns.' },
  { id: 'prophet-hexed-blast', name: 'Hexed Blast', type: 'technique', tier: 'Prophet', icon: iconByTier.Prophet, cooldown: '1', description: 'Selects a grid within 3 grids of the caster. Deals Dark DMG once to all enemies within 2 grids of the target grid. For each type of debuff the target carries, deals additional Dark DMG once, up to 3 times.' },
  { id: 'prophet-radiant-rhythm', name: 'Radiant Rhythm', type: 'technique', tier: 'Prophet', icon: iconByTier.Prophet, cooldown: '1', description: 'Heals 1 ally within 4 grids of the caster once. The effect then chains to 1 random ally within 4 grids of the target, up to 5 times. Repeated healing on the same target is diminished by 35% per instance.' },
  { id: 'prophet-soul-reap', name: 'Soul Reap', type: 'technique', tier: 'Prophet', icon: iconByTier.Prophet, cooldown: '2', description: 'Deals Dark DMG twice to 1 enemy within 3 grids of the caster. For every 5% HP lost by the target, this skill deals 5% more DMG, up to a max of 50% increase. (Prioritizes large targets)' },
  { id: 'prophet-thalasson-summon', name: 'Thalasson Summon', type: 'technique', tier: 'Prophet', icon: iconByTier.Prophet, cooldown: '—', description: 'Summons 1 Thalasson next to the caster that immediately acts. The summon inherits a percentage of the caster\'s stats. (The Technique can only trigger once per battle.)' },
  { id: 'prophet-void-chant', name: 'Void Chant', type: 'technique', tier: 'Prophet', icon: iconByTier.Prophet, cooldown: '2', description: 'Creates a magic rune that lasts 2 turns. When an enemy within 5 grids casts a Technique, the rune deals Dark DMG once to them. If the target carries Erosion, triggers the Erosion effect once. (Zero Initial CD)' },
  { id: 'prophet-cursed-armor', name: 'Cursed Armor', type: 'charm', tier: 'Prophet', icon: iconByTier.Prophet, cooldown: '—', description: 'Each time the caster takes Technique DMG, there\'s a 50% base chance to inflict Erosion on the attacker.' },
  { id: 'prophet-rejuvenating-elixir', name: 'Rejuvenating Elixir', type: 'charm', tier: 'Prophet', icon: iconByTier.Prophet, cooldown: '—', description: 'Carries 3 potions at the start of battle. When an allied character\'s HP falls below 50%, uses a potion to heal them. Produces 1 potion every 3 turns, holding up to 3 at a time.' },
  { id: 'prophet-ring-of-omen', name: 'Ring of Omen', type: 'charm', tier: 'Prophet', icon: iconByTier.Prophet, cooldown: '—', description: 'At the start of the caster\'s turn, reduces Effect RES of all enemies within 5 grids of the caster. This effect is unique. Also there\'s a 50% base chance to inflict Vulnerability for 1 turn.' },
  { id: 'prophet-shadowy-current', name: 'Shadowy Current', type: 'charm', tier: 'Prophet', icon: iconByTier.Prophet, cooldown: '—', description: 'Increases the caster\'s Dark DMG. Killing an enemy deals additional Dark DMG once to all enemies within 1 grid of the target.' },
  { id: 'prophet-soulweave', name: 'Soulweave', type: 'charm', tier: 'Prophet', icon: iconByTier.Prophet, cooldown: '—', description: 'When 3 of the caster\'s summons die or disappear, summons 1 Infernal Fiend in front of the caster that immediately acts. The summon inherits a percentage of the caster\'s stats. (The Charm can only trigger once per battle.)' },
  { id: 'prophet-summoning-pact', name: 'Summoning Pact', type: 'charm', tier: 'Prophet', icon: iconByTier.Prophet, cooldown: '—', description: 'Summoning consumes 2% of the caster\'s max HP to increase the summon\'s HP. Restores all HP consumed by this Charm if the caster survives until victory.' }
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

  function renderSkillCodex() {
    const codex = document.getElementById("allClassSkills");
    const actions = document.getElementById("codexActions");
    if (!codex || !actions) return;

    actions.innerHTML = Object.entries(classTrees).map(([id, tree]) =>
      `<button type="button" class="${id === currentTreeId ? "active" : ""}" data-codex-tree="${id}">${tree.name}</button>`
    ).join("");

    codex.innerHTML = Object.entries(classTrees).map(([id, tree]) => {
      const total = skills.filter((skill) => tree.tiers.includes(skill.tier)).length;
      const tiers = tree.tiers.map((tier) => {
        const techs = skills.filter((skill) => skill.tier === tier && skill.type === "technique");
        const charms = skills.filter((skill) => skill.tier === tier && skill.type === "charm");
        const list = (items) => items.length ? items.map((skill) =>
          `<button class="codex-skill" type="button" data-id="${skill.id}" data-type="${skill.type}"><img src="${skill.icon}" alt="" /><span><strong>${skill.name}</strong><small>${skill.tier} · ${skill.type}${skill.cooldown && skill.cooldown !== "—" ? ` · CD ${skill.cooldown}` : ""}</small></span></button>`
        ).join("") : `<p class="codex-empty">No imported skills yet.</p>`;
        return `<article class="tier-codex"><h4>${tier}</h4><div class="codex-columns"><div class="codex-column"><h5>Techniques (${techs.length})</h5><div class="codex-skill-list">${list(techs)}</div></div><div class="codex-column"><h5>Charms (${charms.length})</h5><div class="codex-skill-list">${list(charms)}</div></div></div></article>`;
      }).join("");
      return `<section class="class-codex ${id === currentTreeId ? "active" : ""}" data-codex-panel="${id}"><div class="class-codex-header"><div><p class="kicker">${tree.colorName}</p><h3>${tree.tiers.join(" → ")}</h3><p>Higher tiers inherit every skill from the tiers above them in this list.</p></div><span class="class-codex-count">${total} imported skills</span></div>${tiers}</section>`;
    }).join("");

    actions.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
      const id = button.dataset.codexTree;
      actions.querySelectorAll("button").forEach((btn) => btn.classList.toggle("active", btn === button));
      codex.querySelectorAll(".class-codex").forEach((panel) => panel.classList.toggle("active", panel.dataset.codexPanel === id));
    }));

    codex.querySelectorAll(".codex-skill").forEach((button) => button.addEventListener("click", () => {
      showSkill(button.dataset.type, button.dataset.id, 0);
      document.getElementById("skillDetail")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }));
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
    renderSkillCodex();
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
