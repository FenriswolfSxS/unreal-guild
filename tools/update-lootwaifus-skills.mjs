#!/usr/bin/env node
/*
  Pulls Sword x Staff skill names/icons/details from Loot & Waifus and writes them into this site.

  Run from the repository root:
    node tools/update-lootwaifus-skills.mjs

  What it updates:
    - builds.html embedded buildLabData JSON
    - data/skills.json, if present
    - assets/skills/*.png icons downloaded from Loot & Waifus
    - logs/lootwaifus-skill-sync.json report

  Notes:
    Loot & Waifus currently exposes the skill database as a rendered page, not a guaranteed public
    skills API. This script is intentionally defensive: it first tries to harvest structured JSON
    from the page scripts, then falls back to parsing the rendered skill cards/images.
*/
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const DATABASE_URL = 'https://lootandwaifus.com/sword-x-staff-skill-database/';
const SITE_ORIGIN = 'https://lootandwaifus.com';
const buildsPath = path.join(root, 'builds.html');
const dataPath = path.join(root, 'data', 'skills.json');
const skillIconDir = path.join(root, 'assets', 'skills');
const logDir = path.join(root, 'logs');

const CLASS_TO_PATH = {
  Warrior: 'duelist', Duelist: 'duelist', Berserker: 'duelist', Conqueror: 'duelist', Ravager: 'duelist', Marauder: 'duelist',
  Knight: 'knight', Paladin: 'knight', Guardian: 'knight', Templar: 'knight', Justicar: 'knight',
  Mage: 'sorcerer', Sorcerer: 'sorcerer', Archmage: 'sorcerer', Destroyer: 'sorcerer', Magister: 'sorcerer', 'Null Archmage': 'sorcerer', 'Meteor Bladestorm': 'sorcerer',
  Sage: 'sage', Arcanist: 'sage', Dominator: 'sage', Prophet: 'sage', Hierarch: 'sage', Arcanarch: 'sage', 'All-Knowing Sovereign': 'sage'
};
const CLASS_TIER = {
  Warrior: 1, Mage: 1,
  Duelist: 2, Knight: 2, Sorcerer: 2, Sage: 2,
  Berserker: 3, Paladin: 3, Archmage: 3, Arcanist: 3,
  Conqueror: 4, Guardian: 4, Destroyer: 4, Dominator: 4,
  Ravager: 5, Templar: 5, Magister: 5, Prophet: 5,
  Marauder: 6, Justicar: 6, Hierarch: 6, Arcanarch: 6, 'Null Archmage': 6, 'Meteor Bladestorm': 6, 'All-Knowing Sovereign': 6, 'Radiant Paladin': 6
};

function slugify(value){
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'skill';
}
function normalizeName(value){
  return String(value || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
function decodeHtml(str){
  return String(str || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}
function absoluteUrl(src){
  if(!src) return '';
  if(src.startsWith('http')) return src;
  if(src.startsWith('//')) return `https:${src}`;
  return new URL(src, SITE_ORIGIN).href;
}
function localIconPath(name){
  return `assets/skills/lw-${slugify(name)}.png`;
}
function inferType(item){
  const raw = `${item.type || ''} ${item.category || ''} ${item.kind || ''}`.toLowerCase();
  if(raw.includes('charm')) return 'charm';
  if(raw.includes('tech')) return 'technique';
  return undefined;
}
function inferTier(item){
  const candidates = [item.tier, item.class, item.className, item.job, item.requiredClass, item.category, item.class_name]
    .filter(Boolean)
    .map(String);
  for(const c of candidates){
    const clean = c.trim();
    if(CLASS_TO_PATH[clean]) return clean;
  }
  return undefined;
}
function usefulDescription(item){
  const candidates = [item.description, item.desc, item.effect, item.effects, item.tooltip, item.text, item.content]
    .filter(Boolean)
    .map(v => Array.isArray(v) ? v.join(' ') : String(v));
  const text = candidates.find(v => v.trim().length > 5);
  return text ? decodeHtml(text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()) : undefined;
}
function findCooldown(item){
  const value = item.cooldown ?? item.cd ?? item.cool_down ?? item.skillCooldown ?? item.duration;
  if(value === undefined || value === null || value === '') return undefined;
  if(typeof value === 'number') return `${value}s`;
  return String(value);
}

async function fetchText(url){
  const res = await fetch(url, { headers: { 'user-agent': 'UnrealGuildSkillSync/1.0 (+local site maintenance)' } });
  if(!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  return await res.text();
}
async function download(url, file){
  const res = await fetch(url, { headers: { 'user-agent': 'UnrealGuildSkillSync/1.0 (+local site maintenance)' } });
  if(!res.ok) throw new Error(`Icon download failed ${res.status}: ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, buffer);
}

function harvestObjectsFromScripts(html){
  const objects = [];
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  for(const script of scripts){
    if(!/skill|cooldown|charm|technique|Sword x Staff|swordxstaff/i.test(script)) continue;
    const quotedJsonMatches = [...script.matchAll(/JSON\.parse\((['"])([\s\S]*?)\1\)/g)];
    for(const m of quotedJsonMatches){
      try { collectObjects(JSON.parse(JSON.parse(`"${m[2].replace(/"/g, '\\"')}"`)), objects); } catch {}
    }
    const rawJsonCandidates = script.match(/\{[\s\S]{100,}\}|\[[\s\S]{100,}\]/g) || [];
    for(const candidate of rawJsonCandidates.slice(0, 10)){
      const cleaned = candidate.replace(/undefined/g, 'null');
      try { collectObjects(JSON.parse(cleaned), objects); } catch {}
    }
  }
  return objects;
}
function collectObjects(value, out){
  if(!value) return;
  if(Array.isArray(value)) return value.forEach(v => collectObjects(v, out));
  if(typeof value === 'object'){
    const name = value.name || value.title || value.skillName || value.label;
    const hasSkillishField = value.icon || value.image || value.src || value.description || value.cooldown || value.type || value.class || value.tier;
    if(name && hasSkillishField) out.push(value);
    for(const v of Object.values(value)) collectObjects(v, out);
  }
}

function parseRenderedSkills(html){
  const skills = new Map();

  // Matches normal rendered img tags. The database cards expose skill name in alt text and icon in src.
  const imgRegex = /<img\b([^>]*?)>/gi;
  for(const match of html.matchAll(imgRegex)){
    const attrs = match[1];
    const alt = decodeHtml((attrs.match(/\balt=["']([^"']+)["']/i) || [])[1] || '');
    const src = decodeHtml((attrs.match(/\bsrc=["']([^"']+)["']/i) || [])[1] || '');
    const title = decodeHtml((attrs.match(/\btitle=["']([^"']+)["']/i) || [])[1] || '');
    let name = alt.replace(/^Image:\s*/i, '').trim() || title.trim();
    if(!name || !src) continue;
    if(/Mage|Warrior|Sage|Sorcerer|Duelist|Knight|Arcanist|Archmage|Berserker|Paladin|Dominator|Destroyer|Conqueror|Guardian|Prophet|Magister|Ravager|Templar|Hierarch|Arcanarch|Marauder|Justicar/i.test(name) && !/\s/.test(name)) continue;
    if(/profile|banner|logo|discord|youtube/i.test(name)) continue;
    skills.set(normalizeName(name), { name, iconUrl: absoluteUrl(src), source: DATABASE_URL });
  }

  // Fallback for Next/image chunks or preloaded image URLs if normal img src was optimized.
  const iconUrlRegex = /(https?:\\?\/\\?\/lootandwaifus\.com)?\\?\/skills\\?\/swordxstaff\\?\/([a-zA-Z0-9_\-.]+\.png)/g;
  const urls = [...html.matchAll(iconUrlRegex)].map(m => absoluteUrl(`/skills/swordxstaff/${m[2]}`));
  for(const url of urls){
    const base = path.basename(url, '.png').replace(/^monsterskill_?/, '');
    // Keep these as unmatched icon candidates; structured/script extraction may attach names later.
    const key = `icon:${url}`;
    if(!skills.has(key)) skills.set(key, { name: '', iconUrl: url, source: DATABASE_URL });
  }

  return [...skills.values()].filter(x => x.name && x.iconUrl);
}

function parseSkillObjects(objects){
  const out = [];
  for(const obj of objects){
    const name = decodeHtml(obj.name || obj.title || obj.skillName || obj.label || '').trim();
    if(!name) continue;
    const iconRaw = obj.icon || obj.image || obj.img || obj.src || obj.icon_url || obj.iconUrl;
    const iconUrl = iconRaw ? absoluteUrl(String(iconRaw).startsWith('tooltips/') || String(iconRaw).startsWith('skills/') ? `/${iconRaw}` : String(iconRaw)) : undefined;
    const tier = inferTier(obj);
    const pathId = tier ? CLASS_TO_PATH[tier] : undefined;
    const parsed = {
      name,
      iconUrl,
      source: DATABASE_URL,
      type: inferType(obj),
      tier,
      tierNumber: tier ? CLASS_TIER[tier] : undefined,
      path: pathId,
      cooldown: findCooldown(obj),
      description: usefulDescription(obj)
    };
    out.push(parsed);
  }
  return out;
}

function mergeScraped(a, b){
  const merged = new Map();
  for(const item of [...a, ...b]){
    const key = normalizeName(item.name);
    if(!key) continue;
    const old = merged.get(key) || {};
    merged.set(key, { ...old, ...Object.fromEntries(Object.entries(item).filter(([,v]) => v !== undefined && v !== '')) });
  }
  return [...merged.values()];
}

function extractBuildData(html){
  const match = html.match(/<script\s+id=["']buildLabData["']\s+type=["']application\/json["']>([\s\S]*?)<\/script>/i);
  if(!match) throw new Error('Could not find <script id="buildLabData"> in builds.html');
  return { match, data: JSON.parse(match[1]) };
}
function writeBuildData(html, oldMatch, data){
  const json = JSON.stringify(data);
  return html.replace(oldMatch[0], `<script id="buildLabData" type="application/json">${json}</script>`);
}

async function main(){
  console.log(`Fetching ${DATABASE_URL}`);
  const html = await fetchText(DATABASE_URL);
  const objects = harvestObjectsFromScripts(html);
  const structured = parseSkillObjects(objects);
  const rendered = parseRenderedSkills(html);
  const scraped = mergeScraped(structured, rendered);
  console.log(`Scraped ${scraped.length} named skills/icons from Loot & Waifus.`);

  const buildsHtml = await fs.readFile(buildsPath, 'utf8');
  const { match, data } = extractBuildData(buildsHtml);
  const byName = new Map(scraped.map(s => [normalizeName(s.name), s]));
  let matched = 0;
  let iconsDownloaded = 0;
  let descriptionsUpdated = 0;
  const missing = [];

  await fs.mkdir(skillIconDir, { recursive: true });

  for(const skill of data.skills){
    const scrapedSkill = byName.get(normalizeName(skill.name));
    if(!scrapedSkill){ missing.push(skill.name); continue; }
    matched++;
    skill.source = DATABASE_URL;
    skill.iconSource = scrapedSkill.iconUrl || skill.iconSource || '';
    if(scrapedSkill.type) skill.type = scrapedSkill.type;
    if(scrapedSkill.tier && CLASS_TO_PATH[scrapedSkill.tier]){
      skill.tier = scrapedSkill.tier;
      skill.tierNumber = scrapedSkill.tierNumber || skill.tierNumber;
      skill.path = scrapedSkill.path || skill.path;
    }
    if(scrapedSkill.cooldown) skill.cooldown = scrapedSkill.cooldown;
    if(scrapedSkill.description && !/description pending/i.test(scrapedSkill.description)){
      skill.description = scrapedSkill.description;
      descriptionsUpdated++;
    }
    if(scrapedSkill.iconUrl){
      const rel = localIconPath(skill.name);
      const abs = path.join(root, rel);
      try{
        await download(scrapedSkill.iconUrl, abs);
        skill.iconPath = rel;
        iconsDownloaded++;
      } catch(err){
        console.warn(`Icon failed for ${skill.name}: ${err.message}`);
      }
    }
  }

  data.count = data.skills.length;
  await fs.writeFile(buildsPath, writeBuildData(buildsHtml, match, data), 'utf8');
  try{
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify(data.skills, null, 2), 'utf8');
  } catch {}

  await fs.mkdir(logDir, { recursive: true });
  const report = {
    source: DATABASE_URL,
    scrapedCount: scraped.length,
    localSkillCount: data.skills.length,
    matched,
    iconsDownloaded,
    descriptionsUpdated,
    unmatchedLocalSkills: missing,
    ranAt: new Date().toISOString()
  };
  await fs.writeFile(path.join(logDir, 'lootwaifus-skill-sync.json'), JSON.stringify(report, null, 2));
  console.log(`Done. Matched ${matched}/${data.skills.length}, downloaded ${iconsDownloaded} icons, updated ${descriptionsUpdated} descriptions.`);
  console.log('Report written to logs/lootwaifus-skill-sync.json');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
