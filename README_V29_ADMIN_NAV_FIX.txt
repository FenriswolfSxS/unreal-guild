SxS The Unreal V29

Fixes the duplicate Admin navigation link on the Admin page.
The account navigation script now recognizes an existing admin.html link even when it does not already carry the admin-nav-link CSS class.
All pages use a cache-busted auth-ui.js?v=29 reference so Cloudflare/browser caches load the corrected script.
