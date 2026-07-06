Python Skill Sync
=================

This version does NOT require Node.js.

Option 1 - easiest:
Double-click UpdateSkills.bat

Option 2 - PowerShell:
py -3 tools\update_lootwaifus_skills.py

The script pulls skill/icon data from:
https://lootandwaifus.com/sword-x-staff-skill-database/

It updates:
- builds.html
- data/skills.json
- assets/skills/lw-*.png
- logs/lootwaifus-skill-sync.json

After it finishes, open the site locally to test, then commit and push with GitHub Desktop.
