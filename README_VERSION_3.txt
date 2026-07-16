SxS The Unreal - Version 3
==========================

Goal:
- Keep the existing theme, Build Lab, skills, guide style, and class data intact.
- Add the foundation for a real guild management system.

Version 3 adds:
1. Leadership permissions
   - Leader, Deputy, and Officer share the same permissions.
   - Member can edit own profile, create posts, edit/delete own posts, and later manage own builds.

2. Editable homepage bubbles
   - Admin page can edit the 4 homepage cards.
   - Data is stored in D1 table: home_bubbles.

3. Editable guide content
   - Admin page can edit guide page content stored in D1 table: site_pages.
   - This is the foundation for Phee/leadership to update guides without touching GitHub.

4. Future screenshot uploads
   - Schema includes media_assets.
   - Actual uploads should use Cloudflare R2 in the next step.

5. Admin dashboard
   - admin.html
   - js/admin.js
   - API routes under /api/content

IMPORTANT SETUP
---------------
Run db/schema.sql in Cloudflare D1 after deploying this version.

Cloudflare bindings needed:
- D1 binding: DB -> unreal-guild
- Secret: RANK_VERIFICATION_PASSWORD -> Unreal Death

Do not delete your .git folder.
Do not change the theme/skills/build data unless intentionally requested.
