V47 REAL BUILD FIXES

1. My Builds now requests all builds owned by the signed-in user, not only the currently selected path. Responses use no-store caching and every insert is verified in D1 before success is returned.
2. Warrior and Mage T1 cards are de-duplicated by tier + type + ability name. No skill data or images are deleted.
3. Published builds use a compact two-column desktop layout and one column on mobile.
4. Admin/leader/deputy/officer can drag any build. A creator can drag their own build while the API protects the relative order of other members' builds.
5. sort_order is added automatically to member_builds. No destructive migration is required.
6. HTML asset query strings were updated so Cloudflare/browser caches load the new JavaScript and CSS.
