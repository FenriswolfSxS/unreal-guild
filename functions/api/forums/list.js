import { json } from '../_lib.js';

const STARTER = [
  ['conqueror','Conqueror','class','<img src="assets/class-icons/conqueror.png" alt="Conqueror">','Warrior damage builds, Conqueror / Ravager rotations, PvP pressure, and weapon choices.'],
  ['guardian','Guardian','class','<img src="assets/class-icons/guardian.png" alt="Guardian">','Tank builds, Guardian / Templar questions, survivability, threat, and group support.'],
  ['destroyer','Destroyer','class','<img src="assets/class-icons/destroyer.png" alt="Destroyer">','Mage damage, Destroyer / Magister theorycrafting, cooldowns, burst, and utility.'],
  ['dominator','Dominator','class','<img src="assets/class-icons/dominator.png" alt="Dominator">','Sage builds, Dominator / Prophet setups, healing, summons, support, and control.'],
  ['game','The Game','game','🎮','General Sword X Staff discussion, questions, guides, updates, and progression help.'],
  ['away','Away / Unable to Attend','away','📅','Post when you will be away, late, or unable to attend guild events.']
];
async function ensure(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS forum_categories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    icon TEXT NOT NULL DEFAULT '💬',
    description TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS forum_threads (
    id TEXT PRIMARY KEY,
    forum_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    author_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (forum_id) REFERENCES forum_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
  )`).run();
  let i=1;
  for(const row of STARTER){
    await env.DB.prepare('INSERT OR IGNORE INTO forum_categories (id,title,type,icon,description,sort_order) VALUES (?,?,?,?,?,?)')
      .bind(row[0],row[1],row[2],row[3],row[4],i++).run();
  }
}
export async function onRequestGet({ env }){
  if(!env.DB) return json({ok:false,error:'D1 binding DB is missing.'},500);
  await ensure(env);
  const forums = await env.DB.prepare(`SELECT f.*, COUNT(t.id) AS post_count FROM forum_categories f LEFT JOIN forum_threads t ON t.forum_id=f.id GROUP BY f.id ORDER BY f.sort_order, lower(f.title)`).all();
  return json({ok:true, forums: forums.results || []});
}
