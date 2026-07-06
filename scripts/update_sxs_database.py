#!/usr/bin/env python3
"""
Sword x Staff skill/icon updater for the Unreal Guild Build Lab.

Run from the website folder:
    python scripts/update_sxs_database.py

What it does:
- pulls public skill data from Prydwen's Sword x Staff skills page
- attempts to cross-check names against EOG's Sword x Staff database hub
- downloads skill/class icons into assets/skills/
- writes data/skills.json
- writes js/skills.generated.js
- patches builds.html to prefer the generated data when present

Notes:
- This script downloads assets to YOUR local project. Do not redistribute assets unless you have rights/permission.
- If a site blocks normal requests, install Playwright and rerun:
    pip install playwright bs4 requests
    python -m playwright install chromium
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import hashlib
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin, urlparse

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Missing packages. Run: pip install requests beautifulsoup4")
    raise

PRYDWEN = "https://www.prydwen.gg/sword-x-staff/skills"
EOG = "https://eog.gg/games/sword-x-staff/#database"
ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
ICON_DIR = ROOT / "assets" / "skills"
JS_DIR = ROOT / "js"
BUILD_HTML = ROOT / "builds.html"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
}

TIER_ORDER = {
    # Warrior lines
    "Warrior": 1, "Duelist": 2, "Knight": 2, "Berserker": 3, "Paladin": 3,
    "Conqueror": 4, "Guardian": 4,
    # Mage lines
    "Mage": 1, "Sorcerer": 2, "Sage": 2, "Archmage": 3, "Arcanist": 3,
    "Destroyer": 4, "Dominator": 4,
    # 5th tier names seen in current public databases/community mirrors
    "Ravager": 5, "Templar": 5, "Magister": 5, "Prophet": 5,
}

CLASS_PATHS = {
    "duelist": ["Warrior", "Duelist", "Berserker", "Conqueror", "Ravager"],
    "knight": ["Warrior", "Knight", "Paladin", "Guardian", "Templar"],
    "sorcerer": ["Mage", "Sorcerer", "Archmage", "Destroyer", "Magister"],
    "sage": ["Mage", "Sage", "Arcanist", "Dominator", "Prophet"],
}

@dataclass
class Skill:
    id: str
    name: str
    type: str
    tier: str
    tierNumber: int
    icon: str
    iconSource: str
    cooldown: str
    description: str
    source: str


def slug(s: str) -> str:
    s = s.strip().lower().replace("’", "'")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "skill"


def get(url: str) -> str:
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.text


def get_with_playwright(url: str) -> str:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise RuntimeError("Playwright not installed. Run: pip install playwright && python -m playwright install chromium")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(user_agent=HEADERS["User-Agent"])
        page.goto(url, wait_until="networkidle", timeout=90000)
        html = page.content()
        browser.close()
        return html


def fetch_html(url: str) -> str:
    html = get(url)
    # Prydwen sometimes serves a static shell first. Use Playwright if needed.
    if "Showing 232 skills" not in html and "Sword x Staff Skills" not in html:
        try:
            html = get_with_playwright(url)
        except Exception as e:
            print(f"Normal fetch looked thin and Playwright failed: {e}")
    return html


def image_url_for_card(card, skill_name: str, base_url: str) -> str:
    wanted = skill_name.lower().strip()
    best = ""
    for img in card.find_all("img"):
        alt = (img.get("alt") or img.get("title") or "").lower().strip()
        src = img.get("src") or img.get("data-src") or ""
        srcset = img.get("srcset") or ""
        if not src and srcset:
            src = srcset.split(",")[0].strip().split(" ")[0]
        if not src:
            continue
        full = urljoin(base_url, src)
        if alt == wanted or wanted in alt:
            return full
        if not best:
            best = full
    return best


def parse_prydwen(html: str) -> list[Skill]:
    soup = BeautifulSoup(html, "html.parser")
    skills: list[Skill] = []
    seen = set()

    # Strategy 1: parse card-like containers that have a heading and Technique/Charm text.
    headings = soup.find_all(re.compile("^h[2-6]$"))
    for h in headings:
        name = h.get_text(" ", strip=True)
        if not name or name.lower() in {"skills", "filters", "sword x staff skills"}:
            continue
        # Find a reasonable card/container around the heading.
        card = h
        for _ in range(5):
            if card.parent:
                card = card.parent
                txt = card.get_text("\n", strip=True)
                if re.search(r"\b(Technique|Charm)\b", txt) and len(txt) < 2500:
                    break
        txt = card.get_text("\n", strip=True)
        m = re.search(r"\b(Technique|Charm)\s+([A-Za-z' -]+)", txt)
        if not m:
            continue
        typ, tier = m.group(1).lower(), m.group(2).strip()
        if tier not in TIER_ORDER:
            # trim extra words if parser captured too much
            tier = next((t for t in TIER_ORDER if re.search(rf"\b{re.escape(t)}\b", m.group(2))), tier)
        lines = [x.strip() for x in txt.split("\n") if x.strip()]
        desc_parts = []
        cooldown = "—"
        start = False
        for line in lines:
            if line == name:
                start = True
                continue
            if not start:
                continue
            if re.match(r"^(Technique|Charm)\b", line):
                continue
            cm = re.match(r"Cooldown:\s*(.+)", line, re.I)
            if cm:
                cooldown = cm.group(1).strip()
                continue
            if line.lower() in {"keywords", "tags"}:
                break
            # Ignore tiny UI labels and image alts that equal a class name.
            if line in TIER_ORDER or line == "Image":
                continue
            if len(line) > 8:
                desc_parts.append(line)
        description = " ".join(desc_parts).strip()
        icon_url = image_url_for_card(card, name, PRYDWEN)
        sid = slug(f"{tier}-{name}")
        if sid in seen:
            continue
        seen.add(sid)
        skills.append(Skill(sid, name, typ, tier, TIER_ORDER.get(tier, 0), "", icon_url, cooldown, description, PRYDWEN))

    # Strategy 2: fallback parse from plain lines if DOM cards fail.
    if len(skills) < 200:
        text = soup.get_text("\n", strip=True)
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        skills = []
        seen.clear()
        for i, line in enumerate(lines):
            if i + 2 >= len(lines):
                continue
            name = line
            next_line = lines[i + 1]
            m = re.match(r"^(Technique|Charm)\s+([A-Za-z' -]+)$", next_line)
            if not m:
                continue
            typ, tier = m.group(1).lower(), m.group(2).strip()
            if tier not in TIER_ORDER:
                continue
            desc = []
            cooldown = "—"
            for j in range(i + 2, min(i + 10, len(lines))):
                if re.match(r"^(Cooldown:)", lines[j], re.I):
                    cooldown = re.sub(r"^Cooldown:\s*", "", lines[j], flags=re.I)
                    continue
                if lines[j].lower() == "keywords" or re.match(r"^(Technique|Charm)\s+", lines[j]):
                    break
                if len(lines[j]) > 8:
                    desc.append(lines[j])
            sid = slug(f"{tier}-{name}")
            if sid not in seen:
                seen.add(sid)
                skills.append(Skill(sid, name, typ, tier, TIER_ORDER[tier], "", "", cooldown, " ".join(desc), PRYDWEN))

    skills.sort(key=lambda s: (s.tierNumber, s.tier, s.type, s.name))
    return skills


def ext_from_response(url: str, content_type: str) -> str:
    path = urlparse(url).path.lower()
    for ext in [".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg"]:
        if path.endswith(ext):
            return ext
    if "webp" in content_type: return ".webp"
    if "png" in content_type: return ".png"
    if "jpeg" in content_type or "jpg" in content_type: return ".jpg"
    if "svg" in content_type: return ".svg"
    return ".png"


def download_icons(skills: list[Skill]) -> None:
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update(HEADERS)
    for idx, s in enumerate(skills, 1):
        if not s.iconSource:
            continue
        try:
            r = session.get(s.iconSource, timeout=30)
            r.raise_for_status()
            ext = ext_from_response(s.iconSource, r.headers.get("content-type", ""))
            filename = f"{s.id}{ext}"
            path = ICON_DIR / filename
            path.write_bytes(r.content)
            s.icon = f"assets/skills/{filename}"
            print(f"[{idx:03}/{len(skills)}] icon OK: {s.name}")
            time.sleep(0.05)
        except Exception as e:
            print(f"[{idx:03}/{len(skills)}] icon failed for {s.name}: {e}")
            s.icon = ""


def cross_reference_eog(skills: list[Skill]) -> dict:
    report = {"checked": False, "matched_names": 0, "notes": []}
    try:
        html = fetch_html(EOG)
        text = BeautifulSoup(html, "html.parser").get_text(" ", strip=True).lower()
        report["checked"] = True
        for s in skills:
            if s.name.lower() in text:
                report["matched_names"] += 1
        if report["matched_names"] == 0:
            report["notes"].append("EOG database hub loaded, but skill rows were not present in static HTML. This is normal for JS-driven pages.")
    except Exception as e:
        report["notes"].append(f"EOG check failed: {e}")
    return report


def write_outputs(skills: list[Skill], report: dict) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    JS_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "updatedBy": "scripts/update_sxs_database.py",
        "sources": [PRYDWEN, EOG],
        "count": len(skills),
        "classPaths": CLASS_PATHS,
        "eogCrossReference": report,
        "skills": [asdict(s) for s in skills],
    }
    (DATA_DIR / "skills.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    js = "window.SXS_SKILL_DATABASE = " + json.dumps(payload, ensure_ascii=False) + ";\n"
    (JS_DIR / "skills.generated.js").write_text(js, encoding="utf-8")


def patch_builds_html() -> None:
    if not BUILD_HTML.exists():
        return
    html = BUILD_HTML.read_text(encoding="utf-8")
    if "js/skills.generated.js" not in html:
        html = html.replace("</head>", '<script src="js/skills.generated.js"></script>\n</head>')
    # Replace the first `const skills = [` with generated-data support, but keep fallback array.
    html = html.replace("const skills = [", "const skills = (window.SXS_SKILL_DATABASE && window.SXS_SKILL_DATABASE.skills) ? window.SXS_SKILL_DATABASE.skills : [", 1)
    BUILD_HTML.write_text(html, encoding="utf-8")


def main() -> int:
    print("Fetching Prydwen skills...")
    html = fetch_html(PRYDWEN)
    skills = parse_prydwen(html)
    print(f"Parsed {len(skills)} skills from Prydwen")
    if len(skills) < 200:
        print("WARNING: Parsed fewer than 200 skills. The site may have changed or blocked the request.")
        print("Try: pip install playwright && python -m playwright install chromium")
    print("Cross-referencing EOG hub...")
    report = cross_reference_eog(skills)
    print("Downloading icons...")
    download_icons(skills)
    write_outputs(skills, report)
    patch_builds_html()
    print("\nDone.")
    print(f"Wrote: {DATA_DIR / 'skills.json'}")
    print(f"Wrote: {JS_DIR / 'skills.generated.js'}")
    print(f"Icons: {ICON_DIR}")
    print(f"Skill count: {len(skills)}")
    print("Now open builds.html locally or commit/push the folder to GitHub Pages.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
