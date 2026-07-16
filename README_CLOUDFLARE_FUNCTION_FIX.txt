Cloudflare Pages Function publish fix

The deploy log showed assets were published successfully, then Cloudflare failed while publishing the Function.

This package adds _routes.json so Cloudflare only invokes Pages Functions for /api/* instead of trying to route all static pages through the Function worker.

After upload/deploy:
1. Make sure your Cloudflare Pages project has a D1 database binding named exactly: DB
2. Add environment variable/secret: RANK_VERIFICATION_PASSWORD
3. Import db/schema.sql into the D1 database.
4. Redeploy.

If the same Cloudflare internal error continues, retry once from Cloudflare. Cloudflare has had intermittent "Unknown internal error occurred" publish errors, but this package removes the main project-side routing issue.
