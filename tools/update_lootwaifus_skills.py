#!/usr/bin/env python3
# Unreal Guild Loot & Waifus skill updater.
# Uses only Python standard library. Run from the website folder with:
#   py -3 tools/update_lootwaifus_skills.py

from __future__ import annotations

import base64
import html as html_lib
import json
import mimetypes
import os
import re
import sys
import time
import traceback
import unicodedata
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).resolve().parents[1]
SOURCE_URL = 'https://lootandwaifus.com/sword-x-staff-skill-database/'
ORIGIN = 'https://lootandwaifus.com'
BUILDS_HTML = ROOT / 'builds.html'
DATA_DIR = ROOT / 'data'
SKILLS_JSON = DATA_DIR / 'skills.json'
ICON_DIR = ROOT / 'assets' / 'skills'
LOG_DIR = ROOT / 'logs'
LOG_FILE = LOG_DIR / 'lootwaifus-skill-sync.json'

USER_AGENT = 'Mozilla/5.0 UnrealGuildSkillSync/2.0'

PATHS = {
    'duelist': {'name': 'Conqueror', 'icon': 'assets/class-icons/conqueror.png', 'accent': '#e10600', 'classes': ['Warrior', 'Duelist', 'Berserker', 'Conqueror', 'Ravager']},
    'knight': {'name': 'Guardian', 'icon': 'assets/class-icons/guardian.png', 'accent': '#ff8c00', 'classes': ['Warrior', 'Knight', 'Paladin', 'Guardian', 'Templar']},
    'sorcerer': {'name': 'Destroyer', 'icon': 'assets/class-icons/destroyer.png', 'accent': '#1e88ff', 'classes': ['Mage', 'Sorcerer', 'Archmage', 'Destroyer', 'Magister']},
    'sage': {'name': 'Dominator', 'icon': 'assets/class-icons/dominator.png', 'accent': '#22e6bd', 'classes': ['Mage', 'Sage', 'Arcanist', 'Dominator', 'Prophet']},
}
CLASS_TO_PATH = {}
for pid, pdata in PATHS.items():
    for cls in pdata['classes']:
        CLASS_TO_PATH[cls.lower()] = pid
CLASS_TIER = {cls.lower(): i + 1 for pdata in PATHS.values() for i, cls in enumerate(pdata['classes'])}
# Extra labels Loot & Waifus may expose from newer/TW classes.
for cls in ['Marauder', 'Justicar', 'Hierarch', 'Arcanarch', 'All-Knowing Sovereign', 'Null Archmage', 'Meteor Bladestorm', 'Radiant Paladin', 'Monster']:
    CLASS_TIER[cls.lower()] = 6
CLASS_TO_PATH.update({
    'marauder': 'duelist',
    'justicar': 'knight',
    'radiant paladin': 'knight',
    'null archmage': 'sorcerer',
    'meteor bladestorm': 'sorcerer',
    'hierarch': 'sage',
    'arcanarch': 'sage',
    'all-knowing sovereign': 'sage',
})

API_CANDIDATES = [
    'https://lootandwaifus.com/api/swordxstaff/skills.json',
    'https://lootandwaifus.com/api/swordxstaff/skill.json',
    'https://lootandwaifus.com/api/swordxstaff/abilities.json',
    'https://lootandwaifus.com/api/swordxstaff/skill_database.json',
    'https://lootandwaifus.com/api/swordxstaff/skills_database.json',
    'https://lootandwaifus.com/api/swordxstaff/database/skills.json',
    'https://lootandwaifus.com/api/sword-x-staff/skills.json',
]

DETAIL_KEYS = [
    'description', 'desc', 'effect', 'effects', 'skillDescription', 'skill_description',
    'tooltip', 'text', 'content', 'details', 'body', 'summary', 'skillDesc', 'explanation'
]
COOLDOWN_KEYS = ['cooldown', 'cd', 'cool_down', 'coolDown', 'skillCooldown', 'cooldownSeconds', 'CD']
TYPE_KEYS = ['type', 'skillType', 'skill_type', 'category', 'kind', 'group']
CLASS_KEYS = ['class', 'className', 'class_name', 'job', 'tier', 'requiredClass', 'required_class', 'characterClass']
ICON_KEYS = ['icon', 'image', 'img', 'src', 'url', 'iconUrl', 'icon_url', 'imageUrl', 'image_url', 'thumbnail']
NAME_KEYS = ['name', 'title', 'skillName', 'skill_name', 'label']


def clean_text(value) -> str:
    if value is None:
        return ''
    if isinstance(value, (list, tuple)):
        value = ' '.join(clean_text(v) for v in value)
    elif isinstance(value, dict):
        pieces = []
        for k in DETAIL_KEYS + ['value']:
            if k in value:
                pieces.append(clean_text(value[k]))
        value = ' '.join(pieces) if pieces else json.dumps(value, ensure_ascii=False)
    text = html_lib.unescape(str(value))
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.I)
    text = re.sub(r'</p\s*>', '\n', text, flags=re.I)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'[ \t\r\f\v]+', ' ', text)
    text = re.sub(r'\n\s+', '\n', text)
    return text.strip()


def slugify(value: str) -> str:
    value = unicodedata.normalize('NFKD', str(value or ''))
    value = ''.join(c for c in value if not unicodedata.combining(c))
    value = value.lower().replace('’', '').replace("'", '')
    value = re.sub(r'[^a-z0-9]+', '-', value).strip('-')
    return value or 'skill'


def norm_name(value: str) -> str:
    value = clean_text(value).lower().replace('’', '').replace("'", '')
    value = re.sub(r'\([^)]*\)', '', value)
    value = re.sub(r'[^a-z0-9]+', ' ', value).strip()
    return value


def fetch_bytes(url: str) -> tuple[bytes, str]:
    req = Request(url, headers={'User-Agent': USER_AGENT, 'Accept': '*/*'})
    with urlopen(req, timeout=60) as resp:
        ctype = resp.headers.get('Content-Type', '')
        return resp.read(), ctype


def fetch_text(url: str) -> str:
    data, _ = fetch_bytes(url)
    return data.decode('utf-8', errors='replace')


def try_fetch_text(url: str) -> str | None:
    try:
        return fetch_text(url)
    except Exception:
        return None


def absolute_url(value: str) -> str:
    value = clean_text(value).replace('\\/', '/').strip()
    if not value:
        return ''
    if value.startswith('data:'):
        return value
    if value.startswith('//'):
        return 'https:' + value
    if value.startswith('http://') or value.startswith('https://'):
        return value
    return urljoin(ORIGIN, value)


def value_from_keys(obj: dict, keys: list[str]):
    for key in keys:
        if key in obj and obj[key] not in [None, '', [], {}]:
            return obj[key]
    lower = {str(k).lower(): k for k in obj.keys()}
    for key in keys:
        lk = key.lower()
        if lk in lower:
            val = obj[lower[lk]]
            if val not in [None, '', [], {}]:
                return val
    return None


def collect_json_objects(value, out: list[dict]) -> None:
    if isinstance(value, dict):
        name = value_from_keys(value, NAME_KEYS)
        has_skill_field = any(str(k).lower() in {x.lower() for x in NAME_KEYS + DETAIL_KEYS + COOLDOWN_KEYS + TYPE_KEYS + CLASS_KEYS + ICON_KEYS} for k in value.keys())
        if name and has_skill_field:
            out.append(value)
        for child in value.values():
            collect_json_objects(child, out)
    elif isinstance(value, list):
        for child in value:
            collect_json_objects(child, out)


def find_json_balanced(text: str, start: int) -> tuple[str, int] | None:
    opener = text[start]
    closer = '}' if opener == '{' else ']'
    stack = [closer]
    i = start + 1
    in_string = False
    quote = ''
    escaped = False
    while i < len(text):
        ch = text[i]
        if in_string:
            if escaped:
                escaped = False
            elif ch == '\\':
                escaped = True
            elif ch == quote:
                in_string = False
        else:
            if ch in ['"', "'"]:
                in_string = True
                quote = ch
            elif ch == opener:
                stack.append(closer)
            elif opener == '{' and ch == '[':
                stack.append(']')
            elif opener == '[' and ch == '{':
                stack.append('}')
            elif stack and ch == stack[-1]:
                stack.pop()
                if not stack:
                    return text[start:i + 1], i + 1
        i += 1
    return None


def harvest_json_from_text(text: str) -> list[dict]:
    objects: list[dict] = []
    # Direct script JSON blocks, Next/Nuxt, and normal JSON APIs.
    for candidate in [text]:
        stripped = candidate.strip()
        if stripped.startswith('{') or stripped.startswith('['):
            try:
                collect_json_objects(json.loads(stripped), objects)
            except Exception:
                pass
    # JSON.parse("...") blobs.
    for match in re.finditer(r'JSON\.parse\((?P<q>[\'\"])(?P<body>[\s\S]*?)(?P=q)\)', text):
        body = match.group('body')
        for attempt in [body, body.encode('utf-8').decode('unicode_escape', errors='ignore')]:
            try:
                collect_json_objects(json.loads(attempt), objects)
            except Exception:
                pass
    # Script tags that contain JSON-like arrays/objects.
    for m in re.finditer(r'[\[{]', text):
        s = m.start()
        window = text[max(0, s - 300):min(len(text), s + 4000)]
        if not re.search(r'name|skill|cooldown|description|icon|charm|technique', window, re.I):
            continue
        balanced = find_json_balanced(text, s)
        if not balanced:
            continue
        raw, end = balanced
        if len(raw) < 20 or len(raw) > 3000000:
            continue
        try:
            collect_json_objects(json.loads(raw), objects)
        except Exception:
            pass
    return objects


def attrs_to_dict(attr_text: str) -> dict:
    attrs = {}
    for key, quote, val in re.findall(r'([:\w\-@]+)\s*=\s*([\"\'])(.*?)\2', attr_text, flags=re.S):
        attrs[key] = html_lib.unescape(val)
    return attrs


def discover_assets(page_html: str) -> list[str]:
    urls = set()
    for attrs in re.findall(r'<(?:script|link)\b([^>]*?)>', page_html, flags=re.I | re.S):
        d = attrs_to_dict(attrs)
        src = d.get('src') or d.get('href')
        if not src:
            continue
        if src.endswith(('.js', '.json')) or '/_next/static/' in src or '/assets/' in src:
            urls.add(absolute_url(src))
    for raw in re.findall(r'[\"\']([^\"\']+\.(?:js|json))[\"\']', page_html, flags=re.I):
        urls.add(absolute_url(raw))
    return sorted(urls)


def parse_static_cards(page_html: str) -> list[dict]:
    found: list[dict] = []
    img_pattern = re.compile(r'<img\b(?P<attrs>[^>]*?)>', re.I | re.S)
    for m in img_pattern.finditer(page_html):
        attrs = attrs_to_dict(m.group('attrs'))
        alt = clean_text(attrs.get('alt') or attrs.get('title') or '')
        src = attrs.get('src') or attrs.get('data-src') or attrs.get('data-lazy-src') or attrs.get('srcset') or ''
        if ',' in src and ' ' in src:
            src = src.split(',')[0].split()[0]
        if not alt:
            continue
        if alt.lower() in ['mage', 'warrior', 'sage', 'sorcerer', 'duelist', 'knight']:
            continue
        before = page_html[max(0, m.start() - 1200):m.start()]
        after = page_html[m.end():m.end() + 2200]
        context = before + after
        name = alt
        # If the alt says Image: Name in parsed text, raw alt is usually just Name.
        tier = None
        for cls in sorted(CLASS_TIER.keys(), key=len, reverse=True):
            if re.search(r'\b' + re.escape(cls) + r'\b', context, re.I):
                tier = cls.title() if cls != 'all-knowing sovereign' else 'All-Knowing Sovereign'
                break
        typ = None
        if re.search(r'\bcharm\b', context, re.I):
            typ = 'charm'
        if re.search(r'\btechnique\b', context, re.I):
            typ = 'technique'
        desc = None
        for key in ['data-description', 'data-desc', 'aria-label', 'title']:
            if attrs.get(key) and len(clean_text(attrs[key])) > len(name) + 5:
                desc = clean_text(attrs[key])
                break
        found.append({
            'name': name,
            'iconUrl': absolute_url(src),
            'tier': tier,
            'type': typ,
            'description': desc,
            'source': SOURCE_URL,
        })
    return found


def parse_object(obj: dict) -> dict | None:
    name = clean_text(value_from_keys(obj, NAME_KEYS))
    if not name:
        return None
    icon = value_from_keys(obj, ICON_KEYS)
    if isinstance(icon, dict):
        icon = value_from_keys(icon, ['src', 'url', 'path'])
    desc = clean_text(value_from_keys(obj, DETAIL_KEYS))
    cd = value_from_keys(obj, COOLDOWN_KEYS)
    if isinstance(cd, (int, float)):
        cd = f'{cd}s'
    cd = clean_text(cd)
    typ_raw = clean_text(value_from_keys(obj, TYPE_KEYS)).lower()
    typ = None
    if 'charm' in typ_raw:
        typ = 'charm'
    elif 'tech' in typ_raw or 'active' in typ_raw:
        typ = 'technique'
    tier = clean_text(value_from_keys(obj, CLASS_KEYS))
    if tier:
        # Sometimes class info is an object or a joined list.
        best = None
        for cls in sorted(CLASS_TIER.keys(), key=len, reverse=True):
            if re.search(r'\b' + re.escape(cls) + r'\b', tier, re.I):
                best = cls
                break
        tier = best.title() if best else tier
        if tier.lower() == 'all-knowing sovereign':
            tier = 'All-Knowing Sovereign'
    out = {
        'name': name,
        'iconUrl': absolute_url(str(icon)) if icon else '',
        'description': desc,
        'cooldown': cd,
        'type': typ,
        'tier': tier,
        'source': SOURCE_URL,
    }
    # Keep any extra useful fields that match the screenshot details panel.
    extra = {}
    for key in ['level', 'rarity', 'element', 'mana', 'cost', 'castTime', 'cast_time', 'range', 'tags']:
        if key in obj and obj[key] not in [None, '', [], {}]:
            extra[key] = obj[key]
    if extra:
        out['extra'] = extra
    return {k: v for k, v in out.items() if v not in [None, '', [], {}]}


def load_existing_build_data() -> dict:
    if not BUILDS_HTML.exists():
        return {'paths': PATHS, 'skills': []}
    text = BUILDS_HTML.read_text(encoding='utf-8', errors='replace')
    m = re.search(r'<script\s+id=[\"\']buildLabData[\"\']\s+type=[\"\']application/json[\"\']>([\s\S]*?)</script>', text, flags=re.I)
    if not m:
        return {'paths': PATHS, 'skills': []}
    try:
        return json.loads(html_lib.unescape(m.group(1)).strip())
    except Exception:
        return {'paths': PATHS, 'skills': []}


def merge_skills(existing: list[dict], harvested: list[dict]) -> list[dict]:
    """Merge Loot & Waifus details into the Build Lab's known skill list.

    Important: the Loot & Waifus page also exposes glossary/status records and future/TW
    class data. Those broke the Build Lab tiers when we treated every harvested object as
    a Build Lab skill. This function now keeps the site's existing curated Build Lab skill
    list as the source of truth for path, tier, tierNumber, type, and ordering, then only
    imports details/icons/cooldowns/tags/scaling from Loot & Waifus by skill name.
    """
    harvested_by_name: dict[str, list[dict]] = {}
    for item in harvested:
        parsed = parse_object(item) if not (isinstance(item, dict) and item.get('name')) else item
        if not parsed or not parsed.get('name'):
            continue
        harvested_by_name.setdefault(norm_name(parsed['name']), []).append(parsed)

    if not existing:
        # Emergency fallback only. Normal site updates should always have existing skills.
        fallback = []
        for arr in harvested_by_name.values():
            first = dict(arr[0])
            if not first.get('id'):
                first['id'] = f'skill-{slugify(first.get("name"))}'
            first['type'] = str(first.get('type') or 'technique').lower()
            first['cooldown'] = first.get('cooldown') or '—'
            first['description'] = first.get('description') or 'Description pending.'
            fallback.append(first)
        return sorted(fallback, key=lambda s: str(s.get('name','')))

    updated: list[dict] = []
    for old in existing:
        skill = dict(old)
        key = norm_name(skill.get('name', ''))
        candidates = harvested_by_name.get(key, [])
        if candidates:
            # Prefer a candidate whose class field matches the Build Lab tier.
            chosen = next((x for x in candidates if norm_name(x.get('class', '') or x.get('tier', '')) == norm_name(skill.get('tier', ''))), candidates[0])
            # Import display/detail fields only. Do NOT replace path/tier/type from Loot data.
            for fld in ['description', 'cooldown', 'tags', 'keywords', 'scaling', 'iconUrl', 'iconSource', 'source', 'extra']:
                val = chosen.get(fld)
                if val not in [None, '', [], {}]:
                    skill[fld] = val
        skill['type'] = str(skill.get('type') or 'technique').lower()
        skill['cooldown'] = skill.get('cooldown') or '—'
        skill['description'] = skill.get('description') or 'Description pending.'
        if not skill.get('iconUrl') and skill.get('iconSource', '').startswith('http'):
            skill['iconUrl'] = skill['iconSource']
        updated.append(skill)

    def sort_key(s):
        path_index = list(PATHS.keys()).index(s.get('path')) if s.get('path') in PATHS else 99
        return (path_index, int(s.get('tierNumber') or 99), str(s.get('type') or ''), str(s.get('name') or ''))
    return sorted(updated, key=sort_key)

def guess_extension(url: str, content_type: str = '') -> str:
    if url.startswith('data:image/'):
        mt = url.split(';', 1)[0].split(':', 1)[1]
        return mimetypes.guess_extension(mt) or '.png'
    path = unquote(urlparse(url).path)
    ext = Path(path).suffix.lower()
    if ext in ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif']:
        return ext
    if content_type:
        ext = mimetypes.guess_extension(content_type.split(';')[0].strip())
        if ext:
            return ext
    return '.png'


def save_icon(skill: dict) -> bool:
    url = skill.get('iconUrl') or skill.get('iconSource') or skill.get('icon')
    url = absolute_url(str(url)) if url else ''
    if not url:
        return False
    try:
        if url.startswith('data:image/'):
            header, data = url.split(',', 1)
            content = base64.b64decode(data)
            ext = guess_extension(url)
            ctype = header.split(';')[0].replace('data:', '')
        else:
            content, ctype = fetch_bytes(url)
            ext = guess_extension(url, ctype)
        if len(content) < 20:
            return False
        path = ICON_DIR / f'lw-{slugify(skill.get("name", "skill"))}{ext}'
        ICON_DIR.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        skill['iconPath'] = str(path.relative_to(ROOT)).replace(os.sep, '/')
        skill['iconSource'] = url
        return True
    except Exception:
        return False


def update_builds_html(build_data: dict) -> None:
    if not BUILDS_HTML.exists():
        return
    text = BUILDS_HTML.read_text(encoding='utf-8', errors='replace')
    payload = json.dumps(build_data, ensure_ascii=False, separators=(',', ':'))
    new_tag = f'<script id="buildLabData" type="application/json">{payload}</script>'
    new_text, count = re.subn(
        r'<script\s+id=[\"\']buildLabData[\"\']\s+type=[\"\']application/json[\"\']>[\s\S]*?</script>',
        new_tag,
        text,
        count=1,
        flags=re.I,
    )
    if count == 0:
        new_text = text.replace('</body>', new_tag + '\n</body>')
    BUILDS_HTML.write_text(new_text, encoding='utf-8')


def main() -> int:
    print(f'Fetching {SOURCE_URL}')
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    report = {'source': SOURCE_URL, 'started': time.strftime('%Y-%m-%d %H:%M:%S'), 'api_hits': [], 'asset_hits': [], 'errors': []}

    existing_data = load_existing_build_data()
    existing_skills = existing_data.get('skills', [])

    harvested_raw: list[dict] = []
    page_html = ''
    try:
        page_html = fetch_text(SOURCE_URL)
        harvested_raw.extend(parse_static_cards(page_html))
        harvested_raw.extend(harvest_json_from_text(page_html))
    except Exception as exc:
        report['errors'].append(f'main page failed: {exc}')

    # Public JSON dump candidates.
    for url in API_CANDIDATES:
        txt = try_fetch_text(url)
        if not txt:
            continue
        before = len(harvested_raw)
        harvested_raw.extend(harvest_json_from_text(txt))
        gained = len(harvested_raw) - before
        if gained:
            report['api_hits'].append({'url': url, 'objects': gained})

    # Referenced JS/JSON assets can contain the click-modal data.
    for url in discover_assets(page_html):
        txt = try_fetch_text(url)
        if not txt:
            continue
        before = len(harvested_raw)
        harvested_raw.extend(harvest_json_from_text(txt))
        gained = len(harvested_raw) - before
        if gained:
            report['asset_hits'].append({'url': url, 'objects': gained})

    skills = merge_skills(existing_skills, harvested_raw)
    icon_count = 0
    desc_count = 0
    cooldown_count = 0
    for skill in skills:
        if skill.get('description') and skill.get('description') != 'Description pending.':
            desc_count += 1
        if skill.get('cooldown') and skill.get('cooldown') != '—':
            cooldown_count += 1
        if save_icon(skill):
            icon_count += 1
        elif not skill.get('iconPath'):
            skill['iconPath'] = f'assets/skills/{skill.get("id", slugify(skill.get("name")))}.png'

    build_data = {'paths': existing_data.get('paths') or PATHS, 'skills': skills, 'count': len(skills)}
    SKILLS_JSON.write_text(json.dumps(build_data, ensure_ascii=False, indent=2), encoding='utf-8')
    update_builds_html(build_data)

    report.update({
        'finished': time.strftime('%Y-%m-%d %H:%M:%S'),
        'raw_objects_found': len(harvested_raw),
        'skills_written': len(skills),
        'icons_downloaded': icon_count,
        'descriptions_present': desc_count,
        'cooldowns_present': cooldown_count,
        'output': {'skills_json': str(SKILLS_JSON), 'builds_html': str(BUILDS_HTML)},
    })
    LOG_FILE.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')

    print(f'Found {len(harvested_raw)} raw skill/detail records.')
    print(f'Wrote {len(skills)} skills to data/skills.json and builds.html.')
    print(f'Descriptions present: {desc_count}')
    print(f'Cooldowns present: {cooldown_count}')
    print(f'Icons downloaded/updated: {icon_count}')
    print(f'Report: {LOG_FILE}')
    if desc_count == 0:
        print('Note: no descriptions were exposed in the static page/API assets this run. The site may be keeping them client-side only.')
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print('Cancelled.')
        raise SystemExit(130)
    except Exception:
        print('Updater failed:')
        traceback.print_exc()
        raise SystemExit(1)
