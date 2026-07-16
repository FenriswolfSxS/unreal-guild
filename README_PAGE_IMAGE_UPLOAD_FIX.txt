PAGE EDITOR IMAGE UPLOAD FIX
============================

This release fixes image uploads while editing guide/content pages.

Cloudflare bindings required:
- D1 database binding: DB
- R2 bucket binding: R2_ASSETS

In Cloudflare Pages:
Settings > Bindings > Add > R2 bucket
Variable name: R2_ASSETS
Select your media bucket, save, and redeploy.

Changes:
- Accepts PNG, JPG/JPEG, WEBP, and GIF even when a browser omits the MIME type.
- Uses buffered R2 uploads instead of a browser/file stream.
- Shows useful upload errors.
- Does not alter or clear page content after a failed upload.
- Disables the image button while the upload is running.
- Requires Save Changes after a successful upload to store the image in page content.
