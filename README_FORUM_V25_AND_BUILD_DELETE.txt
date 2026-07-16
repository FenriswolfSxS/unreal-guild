UNREAL GUILD - FORUM V25 + ADMIN BUILD DELETE

WHAT CHANGED
- Rebuilt Guild Forums with a modern dark gaming interface.
- Added forum image uploads through the existing R2_ASSETS binding.
- Added image previews and image attachments for new posts and replies.
- Fixed post/reply clearing: editors clear only after D1 confirms a successful insert.
- Added visible saving, success, and error messages.
- Added forum reply persistence and safe automatic D1 column upgrades.
- Added class-colored author names and guild rank labels.
- Added Delete Build controls on class build pages.
- Build owners with delete_own_builds can delete their own builds.
- Users with moderate_builds or admin_dashboard can delete any build.

DEPLOYMENT
1. Upload/deploy this entire project to Cloudflare Pages.
2. Keep the D1 binding named DB.
3. Keep the R2 bucket binding named R2_ASSETS.
4. No destructive database reset is required.
5. The Functions automatically add forum image_url columns when first used.

OPTIONAL SCHEMA
The included db/schema.sql contains the forum_replies table for fresh databases. Existing databases are upgraded by the Functions automatically.

TEST
- Sign in as a member.
- Open Guild Forums, enter a category, create a text post, and refresh.
- Create another post with an image and refresh.
- Reply to a post and refresh.
- Sign in as an admin and open a class build page; Delete Build should appear on each build.
