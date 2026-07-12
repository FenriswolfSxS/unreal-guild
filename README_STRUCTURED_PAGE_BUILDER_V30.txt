SxS The Unreal — Structured Modular Page Builder V30

Changes:
- Replaces the old free-position canvas behavior for editable content with structured rows and columns.
- "+ 2 Column Row" creates one horizontal row with two real columns, not two stacked content rows.
- Adds 1-, 2-, and 3-column rows.
- Select a column with "Add here", then add Heading, Text, Image, Callout, Button, or Divider blocks.
- Drag blocks by the ⋮⋮ handle between columns and rows.
- Precise insertion indicators show where the block will land.
- Row and block Up/Down controls remain available as a reliable fallback.
- Existing V28/V29 block data is migrated automatically in the browser and saved in the V30 row format after Save Page.
- On phones/tablets, columns stack automatically for readability.

Deployment:
1. Upload the complete folder to Cloudflare Pages.
2. Keep bindings DB and R2_ASSETS.
3. No SQL reset or manual migration is required.
4. Open each editable page, turn Edit On, arrange the rows/blocks, and click Save Page.
