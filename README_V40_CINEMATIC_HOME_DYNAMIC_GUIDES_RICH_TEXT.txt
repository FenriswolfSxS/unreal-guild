UNREAL GUILD V40

WHAT CHANGED
1. Added the cinematic red/blue Unreal guild artwork to the homepage hero.
2. Added an admin-only “Create New Guide Page” button to the Guides library.
3. New guide pages are dynamic and data-driven:
   - The guide listing metadata is stored in a new custom_guides D1 table created safely with CREATE TABLE IF NOT EXISTS.
   - Page content is stored through the existing site_pages system.
   - New pages open through guide.html?slug=...
4. Changed the page builder text tools to support highlighted-text formatting.
   - Standard point-size input from 8–96 pt.
   - Highlighted words can receive a different size, font, color, bold, italic, underline, alignment, or reset.
   - When nothing is highlighted, the existing whole-block styling behavior remains available.

DATA SAFETY
- No existing D1 table was deleted, replaced, or cleared.
- No existing D1 records were modified by this package.
- No R2 routes, buckets, bindings, or stored media were changed.
- The new custom_guides table is additive only and is created on first use.
- Existing guide pages, forums, events, builds, member data, login, permissions, media uploads, and roster features remain in place.

DEPLOYMENT
Upload the complete project to Cloudflare Pages as usual. No manual SQL migration is required.
