SxS The Unreal — V37 Persistent Navigation Fix

Changes:
- Replaced sticky navigation with a true fixed header on every standard page.
- Added a reserved top offset so page content is not hidden beneath the header.
- Applied the same fixed navigation behavior to Build Lab and Community Builds.
- Raised navigation and dropdown stacking levels above page heroes, editors, and guide content.
- Increased header opacity and added a shadow so the menu remains readable while scrolling.
- Cache-busted site CSS so browsers and Cloudflare load this fix immediately.

Deploy the complete folder over V36. No SQL changes are required.
