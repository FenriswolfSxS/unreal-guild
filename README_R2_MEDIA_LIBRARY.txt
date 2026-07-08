SxS The Unreal V3 - R2 Media Library Setup

1) In Cloudflare, create the R2 bucket:
   sxstheunreal-assets

2) In Workers & Pages > your Pages project > Settings > Bindings, add:
   Type: R2 bucket
   Variable name: ASSETS
   Bucket: sxstheunreal-assets

3) Confirm D1 is still bound as:
   Variable name: DB
   Database: unreal-guild

4) Confirm secret exists:
   RANK_VERIFICATION_PASSWORD

5) Deploy this version.

6) Sign in with a Leader/Deputy/Officer account.

7) Open admin.html. Use Media Library to upload a test image.

How it works:
- Upload endpoint: /api/media/upload
- List endpoint: /api/media/list
- Public file endpoint: /api/media/file?id=<media_id>
- Uploaded images are stored in R2 under media/<media_id>/<filename>
- Media records are stored in D1 table media_assets.

No extra domain is required. The media file endpoint works under sxstheunreal.com.
A custom subdomain like assets.sxstheunreal.com can be added later.
