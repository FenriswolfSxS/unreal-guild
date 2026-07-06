#!/usr/bin/env python3
"""
Sword x Staff icon updater using Loot & Waifus static skill database.

Run from the website folder:
    pip install requests beautifulsoup4
    python scripts\\update_sxs_database.py

This downloads skill icons into:
    assets/sxs/skills
    assets/skills
and writes:
    js/skills.icons.js
    logs/sxs_icon_report.json
It also patches builds.html/js/app.js so the Build Lab uses local icons when they exist.
"""
from __future__ import annotations

import json
import mimetypes
import re
import shutil
import sys
from pathlib import Path
from typing import Dict, List, Tuple
from urllib.parse import urljoin, urlparse

try:
    import requests
except ImportError:
    print("Missing requests. Run: pip install requests beautifulsoup4")
    raise

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Missing beautifulsoup4. Run: pip install beautifulsoup4")
    raise

ROOT = Path(__file__).resolve().parents[1]
BUILD_HTML = ROOT / "builds.html"
APP_JS = ROOT / "js" / "app.js"
ICON_DIR_PRIMARY = ROOT / "assets" / "sxs" / "skills"
ICON_DIR_COMPAT = ROOT / "assets" / "skills"
JS_ICON_MAP = ROOT / "js" / "skills.icons.js"
LOG_DIR = ROOT / "logs"
LOOT_URL = "https://lootandwaifus.com/sword-x-staff-skill-database/"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    "Referer": LOOT_URL,
}


def slugify(text: str) -> str:
    text = re.sub(r"\([^)]*\)", "", text)
    text = text.lower().replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text or "skill"


def norm(text: str) -> str:
    text = re.sub(r"^image:\s*", "", text.strip(), flags=re.I)
    text = re.sub(r"\([^)]*\)", "", text)
    text = text.replace("’", "'").replace("`", "'")
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def extension_from_response(url: str, response: requests.Response) -> str:
    path_ext = Path(urlparse(url).path).suffix.lower()
    if path_ext in {".png", ".webp", ".jpg", ".jpeg", ".gif", ".svg"}:
        return path_ext
    ctype = response.headers.get("content-type", "").split(";")[0].strip().lower()
    guessed = mimetypes.guess_extension(ctype) or ".png"
    return ".jpg" if guessed == ".jpe" else guessed


def extract_local_skills() -> List[Dict[str, str]]:
    if not BUILD_HTML.exists():
        raise FileNotFoundError(f"Cannot find {BUILD_HTML}")
    text = BUILD_HTML.read_text(encoding="utf-8", errors="ignore")
    pattern = re.compile(r"\{\s*id:\s*'([^']+)'\s*,\s*name:\s*'((?:\\'|[^'])+)'", re.S)
    skills = []
    seen = set()
    for skill_id, raw_name in pattern.findall(text):
        name = raw_name.replace("\\'", "'")
        if skill_id not in seen:
            seen.add(skill_id)
            skills.append({"id": skill_id, "name": name})
    return skills


def extract_loot_icons() -> Dict[str, Dict[str, str]]:
    print(f"Opening {LOOT_URL}")
    html = requests.get(LOOT_URL, headers=HEADERS, timeout=30).text
    soup = BeautifulSoup(html, "html.parser")
    icons: Dict[str, Dict[str, str]] = {}

    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or img.get("data-lazy-src") or ""
        alt = img.get("alt") or img.get("title") or ""
        if not src or not alt:
            continue
        if "swordxstaff" not in src.lower() and "/skills/" not in src.lower() and "skill_" not in src.lower():
            continue
        clean_name = re.sub(r"^image:\s*", "", alt.strip(), flags=re.I)
        if not clean_name:
            continue
        url = urljoin(LOOT_URL, src)
        icons[norm(clean_name)] = {"name": clean_name, "url": url}

    # Some builds expose image URLs in <a href="/skills/swordxstaff/skill_123.png">Image: Name</a>.
    for a in soup.find_all("a"):
        href = a.get("href") or ""
        label = a.get_text(" ", strip=True) or a.get("aria-label") or ""
        if not href or not label:
            continue
        if "swordxstaff" not in href.lower() and "skill_" not in href.lower():
            continue
        clean_name = re.sub(r"^image:\s*", "", label.strip(), flags=re.I)
        if not clean_name:
            continue
        icons.setdefault(norm(clean_name), {"name": clean_name, "url": urljoin(LOOT_URL, href)})

    return icons


def best_match(skill_name: str, icons: Dict[str, Dict[str, str]]):
    n = norm(skill_name)
    if n in icons:
        return icons[n]
    # Secondary pass: match English names against bilingual names like "Burning Flash (灼炎闪袭)".
    for key, val in icons.items():
        if n and (n == key or n in key or key in n):
            return val
    return None


def download_icons(skills: List[Dict[str, str]], icons: Dict[str, Dict[str, str]]) -> Tuple[Dict[str, str], List[dict], List[dict]]:
    ICON_DIR_PRIMARY.mkdir(parents=True, exist_ok=True)
    ICON_DIR_COMPAT.mkdir(parents=True, exist_ok=True)
    icon_map: Dict[str, str] = {}
    downloaded = []
    missing = []

    session = requests.Session()
    session.headers.update(HEADERS)

    for skill in skills:
        match = best_match(skill["name"], icons)
        if not match:
            missing.append(skill)
            continue
        url = match["url"]
        try:
            r = session.get(url, timeout=30)
            r.raise_for_status()
            ext = extension_from_response(url, r)
            filename = f"{skill['id']}{ext}"
            dest = ICON_DIR_PRIMARY / filename
            dest.write_bytes(r.content)
            shutil.copy2(dest, ICON_DIR_COMPAT / filename)
            rel = f"assets/sxs/skills/{filename}".replace("\\", "/")
            icon_map[skill["id"]] = rel
            downloaded.append({"id": skill["id"], "name": skill["name"], "matched": match["name"], "url": url, "file": rel})
            print(f"[{len(downloaded):3}] {skill['name']} -> {filename}")
        except Exception as e:
            missing.append({**skill, "error": str(e), "url": url})
            print(f"FAILED {skill['name']}: {e}")

    return icon_map, downloaded, missing


def write_icon_js(icon_map: Dict[str, str]):
    JS_ICON_MAP.parent.mkdir(parents=True, exist_ok=True)
    JS_ICON_MAP.write_text(
        "window.SXS_SKILL_ICONS = " + json.dumps(icon_map, indent=2, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )


def patch_builds_html():
    if not BUILD_HTML.exists():
        return
    text = BUILD_HTML.read_text(encoding="utf-8", errors="ignore")
    if 'src="js/skills.icons.js"' not in text:
        text = text.replace("<script>\nconst iconByTier", '<script src="js/skills.icons.js"></script>\n<script>\nconst iconByTier')

    helper = "function skillIcon(s){return (window.SXS_SKILL_ICONS&&window.SXS_SKILL_ICONS[s.id])||classIcon(s.tier)}\n"
    if "function skillIcon(s)" not in text:
        text = text.replace("function classIcon(tier){return iconByTier[tier]||''}\n", "function classIcon(tier){return iconByTier[tier]||''}\n" + helper)
    text = re.sub(
        r"function miniHTML\(s\)\{return `([^`]*?)<img src=\"\$\{classIcon\(s\.tier\)\}\" alt=\"\$\{s\.tier\}\"([^`]*?)`\}",
        "function miniHTML(s){return `<div class=\"mini\" style=\"--skillColor:${skillColor(s)}\"><img src=\"${skillIcon(s)}\" alt=\"${s.name}\" onerror=\"this.src=classIcon('${s.tier}')\"></div>`}",
        text,
        count=1,
    )
    text = text.replace('detailIcon.innerHTML=`<img src="${classIcon(s.tier)}" alt="${s.tier}">`;', 'detailIcon.innerHTML=`<img src="${skillIcon(s)}" alt="${s.name}" onerror="this.src=classIcon(\'${s.tier}\')">`;')
    BUILD_HTML.write_text(text, encoding="utf-8")


def patch_app_js():
    if not APP_JS.exists():
        return
    text = APP_JS.read_text(encoding="utf-8", errors="ignore")
    helper = """
function localSkillIcon(skill) {
  return (window.SXS_SKILL_ICONS && window.SXS_SKILL_ICONS[skill.id]) || null;
}
"""
    if "function localSkillIcon(skill)" not in text:
        text = text.replace("function generatedSkillIcon(skill) {", helper + "\nfunction generatedSkillIcon(skill) {")
    text = text.replace("skills.forEach((skill) => { skill.icon = generatedSkillIcon(skill); });", "skills.forEach((skill) => { skill.icon = localSkillIcon(skill) || generatedSkillIcon(skill); });")
    APP_JS.write_text(text, encoding="utf-8")


def main():
    LOG_DIR.mkdir(exist_ok=True)
    skills = extract_local_skills()
    print(f"Local Build Lab skills found: {len(skills)}")
    icons = extract_loot_icons()
    print(f"Loot & Waifus icon records found: {len(icons)}")

    icon_map, downloaded, missing = download_icons(skills, icons)
    write_icon_js(icon_map)
    patch_builds_html()
    patch_app_js()

    report = {
        "source": LOOT_URL,
        "local_skill_count": len(skills),
        "loot_icon_record_count": len(icons),
        "downloaded_count": len(downloaded),
        "missing_count": len(missing),
        "downloaded": downloaded,
        "missing": missing,
    }
    (LOG_DIR / "sxs_icon_report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    print("\nDone.")
    print(f"Downloaded icons: {len(downloaded)}")
    print(f"Missing icons:    {len(missing)}")
    print(f"Icon map:         {JS_ICON_MAP}")
    print(f"Icons folder:     {ICON_DIR_PRIMARY}")
    print(f"Report:           {LOG_DIR / 'sxs_icon_report.json'}")
    if missing:
        print("\nFirst missing skills:")
        for m in missing[:20]:
            print(" - " + m.get("name", m.get("id", "unknown")))


if __name__ == "__main__":
    main()
