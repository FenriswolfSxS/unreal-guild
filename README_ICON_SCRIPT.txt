Sword x Staff Icon/Database Script
==================================

Run this from the website folder on your PC:

1) Install Python packages:
   pip install requests beautifulsoup4

2) Run the updater:
   python scripts/update_sxs_database.py

If it says it parsed fewer than 200 skills, install Playwright and rerun:
   pip install playwright
   python -m playwright install chromium
   python scripts/update_sxs_database.py

What it creates:
- data/skills.json
- js/skills.generated.js
- assets/skills/<downloaded icons>

Then test locally by opening builds.html. If it looks good, upload/push the whole folder to GitHub.

Important: this downloads assets locally to your project. Make sure you have permission/rights to redistribute any official game/site artwork publicly.
