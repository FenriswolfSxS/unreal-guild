Safe Skill and Icon Updater
===========================

Double-click UpdateSkills.bat from the website folder.

What it updates
---------------
- Existing skill descriptions, cooldowns, tags, scaling, and icons
- Missing supported Global-server skills found on the public skill page
- data/skills.json
- The embedded Build Lab data in builds.html
- Local icon files under assets/skills

Database safety
---------------
The updater does not contain Cloudflare credentials and does not call any site API.
It never reads or writes D1, R2, member accounts, builds saved by members, forum data,
or uploaded media.

Safety features
---------------
- Creates a timestamped backup under backups/skill-updates before writing
- Refuses to save an empty skill list
- Refuses to reduce the current skill count
- Rejects duplicate skill IDs and incomplete skill records
- Adds only skills that have a supported class path and are Technique or Charm
- Ignores unsupported future/TW tier-6 classes so Build Lab filters remain valid
- Writes a complete report to logs/lootwaifus-skill-sync.json

After updating
--------------
1. Read the report and note skills_added and icons_downloaded.
2. Open builds.html locally and check each class path.
3. Deploy the static site files normally.

No SQL or Cloudflare database migration is required.
