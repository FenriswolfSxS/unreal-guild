Sword x Staff icon/database updater

Run from this website folder:

1) Install packages:
   pip install requests playwright

2) Install the browser:
   python -m playwright install chromium

3) Run the updater:
   python scripts\update_sxs_database.py

Expected result:
- data\skills.json
- js\skills.generated.js
- assets\sxs\skills\*.webp/png/etc
- assets\skills\*.webp/png/etc compatibility copy
- logs\sxs_crawler_report.json

Then open builds.html locally or commit/push the full folder to GitHub Pages.

If icons still do not download, send back:
- logs\sxs_crawler_report.json
- how many files are in assets\sxs\skills
