IMPORTANT CLOUDFARE PAGES BINDINGS

Use these exact bindings:

D1 database binding:
  Name: DB
  Value: unreal-guild

R2 bucket binding:
  Name: R2_ASSETS
  Value: sxstheunreal-assets

Do NOT name the R2 binding ASSETS on Cloudflare Pages. ASSETS is reserved by Cloudflare Pages/Workers static assets and can cause the final Function publish step to fail with: Unknown internal error occurred.

Do not reset D1. Do not delete the R2 bucket.
