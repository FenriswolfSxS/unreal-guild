Deploy-ready version for member testing.

Important files:
- _routes.json: Cloudflare Pages Functions route config. Do not set exclude to ["/*"].
- member-test.html: live API/D1/member testing panel.
- QUICK_MEMBER_TESTING.txt: one-hour launch checklist.
- db/schema.sql: run this in Cloudflare D1 if /api/health says schema is not ready.

Safe tuning rule:
- Edit one endpoint at a time in functions/api/.
- Test /member-test.html after each change.
- Keep shared helpers in functions/api/_lib.js.
