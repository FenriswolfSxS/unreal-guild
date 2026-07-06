Loot & Waifus Skill Sync
========================

This ZIP includes a scraper/update script:

  tools/update-lootwaifus-skills.mjs

Run it from the root of the website folder:

  node tools/update-lootwaifus-skills.mjs

What it does:
- Fetches https://lootandwaifus.com/sword-x-staff-skill-database/
- Pulls skill names, icon URLs, and any public tooltip/detail data it can find
- Downloads icons into assets/skills/
- Updates the embedded buildLabData inside builds.html
- Updates data/skills.json
- Writes a report to logs/lootwaifus-skill-sync.json

Then commit and push the changed files in GitHub Desktop.

Important:
Loot & Waifus says not all site data is exposed publicly through their JSON/API dumps. The script grabs what is available from the rendered database page and any public structured data on that page.
