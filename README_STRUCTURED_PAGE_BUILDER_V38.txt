SxS THE UNREAL — V38 SAVE PERSISTENCE FIX

WHAT WAS FIXED
- Cloudflare Pages had two implementations for /api/content/page.
- The exact route was older and did not save content_json.
- It returned success while silently discarding the modular layout.
- The exact route now re-exports the current modular page handler.
- Saves are now read back from D1 and verified before the UI reports success.
- POST remains supported for compatibility with older cached clients.
- Frontend assets were cache-busted to structured38.

DEPLOYMENT
Deploy the entire project folder. No SQL reset is required.
Keep the bindings:
- DB
- R2_ASSETS
