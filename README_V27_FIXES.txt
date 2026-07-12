SxS The Unreal v27 fixes

1. Broken uploaded images
The media endpoint now supports both old records that stored the full R2 key and newer records that store only the filename. Existing uploaded images should begin displaying without re-uploading them.

2. Build deletion for leadership
Leader, Deputy, Officer, and Admin ranks can delete any build directly from every class build page. The check is enforced both in the browser and in the API.

3. Forum replies
The reply migration no longer uses a SQLite expression default in ALTER TABLE, which D1 rejects on existing tables. Replies now use explicit timestamps, signed-in members can reply, errors are returned visibly, and the draft/file only clears after D1 confirms the insert.

Deploy the entire project. No destructive database reset is required.
Bindings required: DB and R2_ASSETS.
