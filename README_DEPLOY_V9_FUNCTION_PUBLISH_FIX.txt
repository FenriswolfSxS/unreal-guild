V9 function publish fix

This keeps your same bindings:
D1: DB -> unreal-guild
R2: ASSETS -> sxstheunreal-assets

Do not reset D1. Do not delete R2.

Change: API functions were collapsed behind one catch-all Pages Function at /api/[[path]].js.
This avoids Cloudflare Pages' internal function-publish failure while preserving the existing API routes.
