Loot & Waifus Skill Sync
========================

To update the Build Lab skill data:

1. Open the website folder.
2. Double-click UpdateSkills.bat

Or run this in PowerShell/CMD from the website folder:

py -3 tools\update_lootwaifus_skills.py

What it does:
- Reads the Loot & Waifus Sword x Staff skill database page.
- Checks likely public JSON/API dumps.
- Checks referenced JavaScript/JSON files for the click-detail data.
- Downloads skill icons into assets/skills.
- Writes data/skills.json.
- Updates the embedded Build Lab data inside builds.html.
- Writes a report to logs/lootwaifus-skill-sync.json.

If Loot & Waifus exposes descriptions/cooldowns in public page data or JSON assets, they will be imported automatically. If their detail popups are only available after private JavaScript actions and not exposed in public data, the report will show zero or partial descriptions.
