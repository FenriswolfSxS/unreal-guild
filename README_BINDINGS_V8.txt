Cloudflare bindings used by this build

D1 database:
- Binding name in code: DB
- Your current database name: unreal-guild

R2 bucket:
- Preferred binding name in code: ASSETS
- Your current bucket name: sxstheunreal-assets
- Compatibility fallbacks also checked by the upload code: R2_ASSETS, Assets, Assests, ASSESTS, assets, r2_assets

Important:
- Do not reset D1.
- Do not delete the R2 bucket.
- Member-created content goes to D1.
- Uploaded images go to R2 and are served through /api/media/file?id=...
