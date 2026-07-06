SxS The Unreal - User / Guild Member System

Files added:
- account.html: registration and login
- profile.html: edit in-game name and class
- js/auth-ui.js: account/profile nav helper
- js/account.js: registration/login frontend
- js/profile.js: profile editing frontend
- js/roster.js: dynamic guild roster loader
- functions/api/*: Cloudflare Pages Functions backend
- db/schema.sql: Cloudflare D1 database schema and seed data

Cloudflare setup required:
1. Create/bind a D1 database to the Pages project.
   Binding name must be: DB
2. Run db/schema.sql in the D1 Console.
3. Add a Pages environment variable/secret:
   RANK_VERIFICATION_PASSWORD = Unreal Death

Registration rules:
- Guild Member is selected by default.
- In-game name is required and unique for every account.
- Guild Members must choose class and rank.
- Current classes: Guardian, Conqueror, Destroyer, Dominator.
- Rank hierarchy: Leader, Deputy, Officer, Member.
- Leader/Deputy/Officer require the verification password.
- Regular users do not appear on the Guild Roster.
- Guild members appear on roster automatically.
- Profile edits update roster automatically.
