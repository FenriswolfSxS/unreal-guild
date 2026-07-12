SxS The Unreal — Modular Page Builder V28

WHAT CHANGED
- Guide pages are now made from structured blocks instead of one large editable HTML area.
- Available blocks: Heading, Text, Image, Two Columns, Callout, Button, Divider.
- Leadership editors can move blocks with arrows or drag handles, duplicate them, and delete them.
- Images upload to the existing R2_ASSETS binding and become image blocks.
- Existing page HTML is automatically converted into blocks the first time it loads.
- Saving stores both structured JSON and rendered HTML for backward compatibility.

WHO CAN EDIT
The existing edit_guides/admin permissions continue to control access.

DEPLOYMENT
1. Deploy the complete folder to Cloudflare Pages.
2. Keep bindings named DB and R2_ASSETS.
3. No manual SQL is required. The API safely adds content_json to site_pages on first use.
4. Open a guide page, toggle Edit On, arrange blocks, then click Save Page.

NOTES
- Existing pages are preserved and converted rather than erased.
- The homepage bubble editor remains unchanged.
- This first builder release intentionally uses a controlled set of blocks to reduce layout breakage.
