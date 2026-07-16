V23 COMPACT ROSTER + SITE-WIDE PROFILE LOGIN

Changes:
- Roster is now a compact table-style layout.
- Character photos are fixed to 96 x 96 pixels (about one inch on standard screens).
- When no character photo exists, the previous initial avatar remains as the placeholder.
- Class names retain their database-provided class colors.
- Rank badges have no icons.
- Initial roster ordering remains highest rank to lowest rank using guild_ranks.sort_order ASC.
- The signed-in profile control now uses the same compact themed profile chip across pages that load auth-ui.js.
- The profile photo preview is also 96 x 96 pixels.

Safety:
- No D1 schema, migrations, tables, bindings, R2 handlers, media functions, or existing features were removed.
- db/schema.sql and all functions/api media and database files were left in place.
