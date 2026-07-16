// Keep the exact /api/content/page route and the catch-all API route on the
// same implementation. Cloudflare Pages prefers this exact route when both
// exist, so it must not contain an older copy of the page-saving logic.
export { onRequestGet, onRequestPut } from '../_handlers/content/page.js';

// POST is accepted as a compatibility fallback for older cached clients.
export { onRequestPut as onRequestPost } from '../_handlers/content/page.js';
